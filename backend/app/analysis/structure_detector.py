"""
Detects Phase 1 structures (`array`, `string`, `generic`) from the JSON-safe
step data returned by the sandbox subprocess, combined with AST hints
(which local names are ever subscripted in each function/method). Confidence
follows the rule of thumb in the task spec: a list of numbers/strings that is
also indexed with a variable subscript is very likely `array`; same for a
`str`; anything else falls back to `generic`.

PHASE 2: Stack / Queue / LinkedList / Tree / Graph / Heap / Trie / DP /
Matrix / Recursion-tree / Backtracking detection is out of scope here.

Runs in the PARENT process, not inside the sandbox -- see the design note in
executor.py for why that split is safe and sufficient.
"""
from __future__ import annotations

import re
from typing import Any, Optional

from app.analysis.ast_parser import CodeAnalysis

POINTER_NAME_RE = re.compile(r"(left|right|lo|hi|mid|idx|index|start|end|slow|fast|p1|p2|i|j|k)$", re.IGNORECASE)
SUBSCRIPT_RE = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*([^\[\]]+?)\s*\]")
SIMPLE_ARITH_RE = re.compile(r"^([A-Za-z_]\w*)\s*([+\-])\s*(\d+)$")


def _is_plain_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _classify_container(name: str, value: Any, indexed_names: set) -> Optional[tuple[str, float]]:
    if isinstance(value, list) and len(value) >= 2:
        if all(_is_plain_number(v) or isinstance(v, str) for v in value):
            confidence = 0.93 if name in indexed_names else 0.75
            return "array", confidence
        return None
    if isinstance(value, str) and len(value) >= 2:
        confidence = 0.9 if name in indexed_names else 0.7
        return "string", confidence
    return None


def _parse_subscripts(line_text: str) -> dict:
    subscripts: dict = {}
    for name, expr in SUBSCRIPT_RE.findall(line_text):
        subscripts.setdefault(name, []).append(expr.strip())
    return subscripts


def _resolve_index(expr: str, variables: dict) -> Optional[int]:
    expr = expr.strip()
    try:
        return int(expr)
    except ValueError:
        pass
    if expr in variables and _is_plain_number(variables[expr]):
        return int(variables[expr])
    m = SIMPLE_ARITH_RE.match(expr)
    if m:
        base, op, num = m.groups()
        if base in variables and _is_plain_number(variables[base]):
            base_val = variables[base]
            n = int(num)
            return int(base_val + n if op == "+" else base_val - n)
    return None


def detect_structures_for_step(step: dict, indexed_names_by_function: dict, source_lines: list[str]) -> list[dict]:
    variables = step.get("variables", {}) or {}
    func_name = step.get("functionName")
    indexed_names = indexed_names_by_function.get(func_name, set())

    line_no = step.get("line", 0)
    line_text = source_lines[line_no - 1] if 0 < line_no <= len(source_lines) else ""
    subscripts = _parse_subscripts(line_text)

    structures: list[dict] = []
    for name, value in variables.items():
        classification = _classify_container(name, value, indexed_names)
        if classification is None:
            continue
        stype, confidence = classification
        if confidence < 0.5:
            continue

        length = len(value)
        pointers: dict = {}
        for pname, pval in variables.items():
            if pname == name or not _is_plain_number(pval):
                continue
            if isinstance(pval, float):
                continue
            if POINTER_NAME_RE.search(pname) and 0 <= pval < length:
                pointers[pname] = pval

        active_indices: set = set()
        for idx_expr in subscripts.get(name, []):
            idx_val = _resolve_index(idx_expr, variables)
            if idx_val is not None and 0 <= idx_val < length:
                active_indices.add(idx_val)

        structures.append({
            "id": name,
            "type": stype,
            "values": value,
            "pointers": pointers,
            "highlights": {
                "current": sorted(active_indices),
                "visited": [],
                "active": sorted(active_indices),
            },
            "window": None,
        })
    return structures


def _indexed_names_by_function(analysis: CodeAnalysis) -> dict:
    mapping: dict = {}
    for fn in analysis.functions:
        mapping[fn.name] = fn.indexed_names
    for cls in analysis.classes:
        for method in cls.methods:
            mapping[method.name] = method.indexed_names
    return mapping


def enrich_steps_with_structures(steps: list[dict], analysis: CodeAnalysis, source: str) -> None:
    """Mutates each step's `structures` field in place."""
    indexed_names_by_function = _indexed_names_by_function(analysis)
    source_lines = source.splitlines()
    for step in steps:
        step["structures"] = detect_structures_for_step(step, indexed_names_by_function, source_lines)
