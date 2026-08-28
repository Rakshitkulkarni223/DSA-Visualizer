"""
Static analysis of user-submitted source via the `ast` module. This module
NEVER executes user code -- it only parses it and extracts structural hints
that downstream modules (wrapper.py for entry-point selection, tracer.py for
operation text, structure_detector.py / algorithm_detector.py for detection
confidence) use as cheap, safe priors.
"""
from __future__ import annotations

import ast
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CallableInfo:
    """A top-level function OR a method defined inside a class body."""

    name: str
    params: list[str]
    lineno: int
    class_name: Optional[str] = None
    is_recursive: bool = False
    recursive_call_count: int = 0
    loop_depth: int = 0
    has_list_literal: bool = False
    has_dict_literal: bool = False
    has_set_literal: bool = False
    has_tuple_literal: bool = False
    has_memo: bool = False
    has_cache_write: bool = False
    indexed_names: set = field(default_factory=set)
    calls: set = field(default_factory=set)


@dataclass
class ClassInfo:
    name: str
    methods: list = field(default_factory=list)  # list[CallableInfo]
    is_solution: bool = False
    looks_like_tree_node: bool = False
    looks_like_list_node: bool = False


@dataclass
class CodeAnalysis:
    functions: list = field(default_factory=list)  # list[CallableInfo]
    classes: list = field(default_factory=list)  # list[ClassInfo]
    max_loop_depth: int = 0
    has_recursion: bool = False
    # EVERY function definition in the source -- top-level, direct class
    # methods, AND functions nested inside another function/method (e.g. a
    # `def solve(...):` helper defined inside a class method for memoized
    # recursion). `functions`/`classes` above only capture the first two, which
    # used to make nested-function recursion (a very common DP/backtracking
    # shape) invisible to detection and complexity estimation. Downstream
    # code that wants "every callable in this program" should use this list,
    # not `functions + [m for c in classes for m in c.methods]`.
    all_callables: list = field(default_factory=list)  # list[CallableInfo]


def _loop_depth(node: ast.AST) -> int:
    """Max nesting depth of For/While loops anywhere under `node`."""
    max_depth = 0

    def walk(n: ast.AST, depth: int) -> None:
        nonlocal max_depth
        for child in ast.iter_child_nodes(n):
            if isinstance(child, (ast.For, ast.While)):
                d = depth + 1
                max_depth = max(max_depth, d)
                walk(child, d)
            else:
                walk(child, depth)

    walk(node, 0)
    return max_depth


def _analyze_callable(node: ast.FunctionDef, class_name: Optional[str]) -> CallableInfo:
    info = CallableInfo(
        name=node.name,
        params=[a.arg for a in node.args.args],
        lineno=node.lineno,
        class_name=class_name,
    )
    info.loop_depth = _loop_depth(node)
    recursive_calls = 0
    for n in ast.walk(node):
        if isinstance(n, ast.List):
            info.has_list_literal = True
        elif isinstance(n, ast.Dict):
            info.has_dict_literal = True
        elif isinstance(n, ast.Set):
            info.has_set_literal = True
        elif isinstance(n, ast.Tuple):
            info.has_tuple_literal = True
        elif isinstance(n, ast.Subscript) and isinstance(n.value, ast.Name):
            info.indexed_names.add(n.value.id)
        elif isinstance(n, ast.Assign) and any(
            isinstance(t, ast.Subscript) for t in n.targets
        ):
            # `cache[key] = ...` -- true regardless of whether `cache` is a
            # dict literal created in *this* function's own body or captured
            # by closure from an enclosing scope (the common
            # `outer(): cache = {}; def inner(...): ...; cache[key] = ...`
            # memoization shape, which `has_dict_literal` alone can't see
            # since the literal itself lives outside `inner`'s own subtree).
            info.has_cache_write = True
        elif isinstance(n, ast.Call):
            f = n.func
            if isinstance(f, ast.Name):
                info.calls.add(f.id)
                if f.id == node.name:
                    recursive_calls += 1
            elif (
                isinstance(f, ast.Attribute)
                and class_name is not None
                and f.attr == node.name
                and isinstance(f.value, ast.Name)
                and f.value.id == "self"
            ):
                info.calls.add(f.attr)
                recursive_calls += 1
    info.recursive_call_count = recursive_calls
    info.is_recursive = recursive_calls > 0
    # Heuristic: recursion + (a dict literal in this function's own body, OR
    # a subscript-assignment cache write anywhere in it, which also catches
    # a memo dict captured by closure from an enclosing function) suggests
    # memoized recursion.
    info.has_memo = info.is_recursive and (info.has_dict_literal or info.has_cache_write)
    return info


def _analyze_class(node: ast.ClassDef) -> ClassInfo:
    class_info = ClassInfo(name=node.name, is_solution=(node.name == "Solution"))
    init_attrs: set = set()
    for item in node.body:
        if isinstance(item, ast.FunctionDef):
            class_info.methods.append(_analyze_callable(item, node.name))
            if item.name == "__init__":
                for n in ast.walk(item):
                    if isinstance(n, ast.Assign):
                        for target in n.targets:
                            if (
                                isinstance(target, ast.Attribute)
                                and isinstance(target.value, ast.Name)
                                and target.value.id == "self"
                            ):
                                init_attrs.add(target.attr)
    # TreeNode-like: has left/right (val/value optional). ListNode-like: has
    # next but not left/right (to avoid misclassifying a tree node as a list
    # node just because it also happens to store a `next` pointer).
    class_info.looks_like_tree_node = {"left", "right"}.issubset(init_attrs)
    class_info.looks_like_list_node = ("next" in init_attrs) and not class_info.looks_like_tree_node
    return class_info


def _collect_all_callables(tree: ast.AST) -> list:
    """Every ast.FunctionDef anywhere in the tree, analyzed independently --
    including functions nested inside another function/method. `class_name`
    is only set for a FunctionDef that is a *direct* child of a ClassDef
    (needed for the `self.method()` recursive-call check); a nested function
    isn't itself invoked via `self`, so it gets class_name=None, which simply
    skips that one check and still detects plain by-name self-recursion fine.
    """
    direct_method_class: dict = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    direct_method_class[id(item)] = node.name

    return [
        _analyze_callable(node, direct_method_class.get(id(node)))
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef)
    ]


def analyze_code(source: str) -> CodeAnalysis:
    """Parse `source` and return structural hints. Raises SyntaxError as-is
    (the caller is responsible for turning that into a `syntax_error` API
    response) -- this function never executes the code."""
    tree = ast.parse(source)
    analysis = CodeAnalysis()
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            analysis.functions.append(_analyze_callable(node, None))
        elif isinstance(node, ast.ClassDef):
            analysis.classes.append(_analyze_class(node))

    analysis.all_callables = _collect_all_callables(tree)
    analysis.max_loop_depth = max([c.loop_depth for c in analysis.all_callables] + [0])
    analysis.has_recursion = any(c.is_recursive for c in analysis.all_callables)
    return analysis
