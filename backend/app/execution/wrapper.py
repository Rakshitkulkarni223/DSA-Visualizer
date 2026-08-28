"""
Turns the user's submitted source + the JSON `input` dict into one runnable
script: the user's code, verbatim, followed by a single generated call line
that invokes the detected entry point with the input already bound. This
script (as text) is what gets compiled with a fixed filename and handed to
the tracer -- the tracer never needs to know anything about entry-point
selection.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.analysis.ast_parser import CodeAnalysis

# Fixed filename used for compile()/exec() of the combined script. The
# tracer filters trace events by this exact string so stdlib/framework
# frames are never traced.
USER_CODE_FILENAME = "<user_code>"


@dataclass
class EntryPoint:
    kind: str  # "function" | "method"
    name: str
    class_name: Optional[str]
    params: list[str]  # excludes "self" for methods


def select_entry_point(analysis: CodeAnalysis) -> EntryPoint:
    """
    Pick what to call:
    - `class Solution` with a method -> instantiate Solution() and call a
      method (exactly one public method -> use it; several -> prefer a
      common LeetCode-style name, else the first one defined).
    - else the "outermost" top-level function (one not called by any other
      top-level function), falling back to the last one defined (helpers are
      conventionally defined before the function that uses them).
    """
    solution_cls = next((c for c in analysis.classes if c.name == "Solution"), None)
    if solution_cls is not None and solution_cls.methods:
        public = [m for m in solution_cls.methods if not m.name.startswith("__")]
        method = None
        if len(public) == 1:
            method = public[0]
        elif public:
            preferred_names = {
                "twosum", "solve", "run", "solution", "main", "compute",
            }
            method = next((m for m in public if m.name.lower() in preferred_names), public[0])
        if method is not None:
            return EntryPoint(
                kind="method",
                name=method.name,
                class_name=solution_cls.name,
                params=[p for p in method.params if p != "self"],
            )

    if analysis.functions:
        called_names: set = set()
        for fn in analysis.functions:
            called_names.update(fn.calls)
        candidates = [fn for fn in analysis.functions if fn.name not in called_names]
        chosen = candidates[-1] if candidates else analysis.functions[-1]
        return EntryPoint(kind="function", name=chosen.name, class_name=None, params=list(chosen.params))

    raise ValueError(
        "No callable entry point found: expected a top-level function or a "
        "`class Solution` with a method."
    )


def build_call_line(entry: EntryPoint, input_dict: dict) -> str:
    """
    Build `__RESULT__ = <call>` referencing an `__INPUT__` dict that the
    caller injects directly into the exec() globals (never text-serialized
    into the script -- avoids any need to repr() arbitrary JSON values into
    source code). Parameters are matched by name first; any parameters left
    over are filled positionally from the remaining input keys, in the JSON
    object's original key order.
    """
    matched_by_name = {p for p in entry.params if p in input_dict}
    leftover_keys = iter([k for k in input_dict.keys() if k not in matched_by_name])

    args: list[str] = []
    for p in entry.params:
        if p in input_dict:
            args.append(f"__INPUT__[{p!r}]")
        else:
            key = next(leftover_keys, None)
            args.append(f"__INPUT__[{key!r}]" if key is not None else "None")

    args_str = ", ".join(args)
    if entry.kind == "method":
        return f"__RESULT__ = {entry.class_name}().{entry.name}({args_str})"
    return f"__RESULT__ = {entry.name}({args_str})"


def build_traceable_script(source: str, analysis: CodeAnalysis, input_dict: dict) -> tuple[str, EntryPoint]:
    """Returns (full_script_text, entry_point). Raises ValueError if no entry
    point could be found (caller reports this as a runtime_error)."""
    entry = select_entry_point(analysis)
    call_line = build_call_line(entry, input_dict)
    script = source.rstrip("\n") + "\n\n" + call_line + "\n"
    return script, entry
