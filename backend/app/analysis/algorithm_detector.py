"""
Detects Phase 1 algorithm/pattern types (`two_pointer`, `sliding_window`,
`binary_search`, `recursion`, `iteration`) purely from AST hints -- this
never touches runtime data, so it always runs against the submitted source
text regardless of where structure detection ends up running.

Confidence < 0.5 is dropped entirely (per CONTRACT.md: "never pretend
detection is certain").
"""
from __future__ import annotations

import ast
import re

from app.analysis.ast_parser import CodeAnalysis

POINTER_RE = re.compile(r"^(left|right|lo|hi|p1|p2|slow|fast|i|j)$", re.IGNORECASE)
WINDOW_PARAM_NAMES = {"k", "window", "window_size", "size"}


def _recursive_names(analysis: CodeAnalysis) -> set:
    # analysis.all_callables includes nested function defs (e.g. a memoized
    # `solve(...)` helper defined inside a class method) -- functions/classes
    # alone would miss those and silently under-detect recursion.
    return {c.name for c in analysis.all_callables if c.is_recursive}


def _has_binary_search_pattern(func_node: ast.FunctionDef) -> bool:
    has_mid_calc = False
    for node in ast.walk(func_node):
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.BinOp) and isinstance(node.value.op, ast.FloorDiv):
            left = node.value.left
            if isinstance(left, ast.BinOp) and isinstance(left.op, ast.Add):
                has_mid_calc = True
                break
    has_loop = any(isinstance(n, (ast.While, ast.For)) for n in ast.walk(func_node))
    return has_mid_calc and has_loop


def _aug_assign_incs_decs(func_node: ast.FunctionDef) -> tuple[set, set]:
    incs: set = set()
    decs: set = set()
    for node in ast.walk(func_node):
        if isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name):
            if isinstance(node.op, ast.Add):
                incs.add(node.target.id)
            elif isinstance(node.op, ast.Sub):
                decs.add(node.target.id)
    return incs, decs


def _has_two_pointer_pattern(func_node: ast.FunctionDef) -> float:
    ptr_names = {n.id for n in ast.walk(func_node) if isinstance(n, ast.Name) and POINTER_RE.match(n.id)}
    has_while = any(isinstance(n, ast.While) for n in ast.walk(func_node))
    incs, decs = _aug_assign_incs_decs(func_node)
    moves_opposite = bool(incs & ptr_names) and bool(decs & ptr_names) and len(incs | decs) >= 2
    if has_while and moves_opposite:
        return 0.9
    return 0.0


def _has_sliding_window_pattern(func_node: ast.FunctionDef, param_names: list) -> float:
    has_for_range = any(
        isinstance(n, ast.For) and isinstance(n.iter, ast.Call) and isinstance(n.iter.func, ast.Name) and n.iter.func.id == "range"
        for n in ast.walk(func_node)
    )
    incs, decs = _aug_assign_incs_decs(func_node)
    has_window_param = any(p in WINDOW_PARAM_NAMES for p in param_names)
    if has_for_range and incs and decs and has_window_param:
        return 0.75
    if has_for_range and incs and has_window_param:
        return 0.6
    return 0.0


def detect_algorithms(source: str, analysis: CodeAnalysis) -> list:
    tree = ast.parse(source)
    recursive_names = _recursive_names(analysis)
    detections: dict = {}

    def consider(name: str, confidence: float) -> None:
        if confidence >= 0.5 and (name not in detections or confidence > detections[name]):
            detections[name] = confidence

    for node in ast.walk(tree):
        if not isinstance(node, ast.FunctionDef):
            continue
        param_names = [a.arg for a in node.args.args if a.arg != "self"]

        binary_search = 0.85 if _has_binary_search_pattern(node) else 0.0
        two_pointer = _has_two_pointer_pattern(node)
        sliding_window = _has_sliding_window_pattern(node, param_names)
        recursion = 0.95 if node.name in recursive_names else 0.0

        consider("binary_search", binary_search)
        consider("two_pointer", two_pointer)
        consider("sliding_window", sliding_window)
        consider("recursion", recursion)

        specific_max = max(binary_search, two_pointer, sliding_window, recursion)
        has_loop = any(isinstance(n, (ast.For, ast.While)) for n in ast.walk(node))
        if has_loop and specific_max < 0.5:
            consider("iteration", 0.6)

    return [
        {"type": t, "confidence": round(c, 2)}
        for t, c in sorted(detections.items(), key=lambda kv: -kv[1])
    ]
