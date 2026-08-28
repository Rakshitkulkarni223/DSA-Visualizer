"""
Builds the normalized per-event snapshot dict that tracer.py appends to the
step list. This is the one place that assembles a raw `sys.settrace` frame
into the shape the frontend expects (see StepSnapshot in CONTRACT.md) --
`structures` is intentionally left as an empty list here; it gets filled in
later by app.analysis.structure_detector once the whole step list is back in
the parent process (see the design note in executor.py for why).
"""
from __future__ import annotations

from typing import Any, Optional

from app.state.serializer import coerce_locals, is_class_body_frame


def build_call_frame(frame) -> dict:
    return {
        "function": frame.f_code.co_name,
        "line": frame.f_lineno,
        "locals": coerce_locals(frame.f_locals),
    }


def build_call_stack(frame, filename: str) -> list[dict]:
    """All frames currently on the stack that belong to the user's own code
    file, outermost first / innermost (current frame) last. The synthetic
    module-level frame (co_name == '<module>') and class-body frames (see
    tracer._is_class_body_frame) are excluded so that call-stack depth
    reflects actual function/method calls (e.g. recursion depth)."""
    frames = []
    f = frame
    while f is not None:
        if (
            f.f_code.co_filename == filename
            and f.f_code.co_name != "<module>"
            and not is_class_body_frame(f)
        ):
            frames.append(f)
        f = f.f_back
    frames.reverse()
    return [build_call_frame(fr) for fr in frames]


def make_step_snapshot(
    step: int,
    line: int,
    event: str,
    frame,
    filename: str,
    operation: Optional[dict],
    explanation: Optional[str],
    return_value: Any = None,
) -> dict:
    func_name = None if frame.f_code.co_name == "<module>" else frame.f_code.co_name
    return {
        "step": step,
        "line": line,
        "event": event,
        "functionName": func_name,
        "variables": coerce_locals(frame.f_locals),
        "callStack": build_call_stack(frame, filename),
        "structures": [],
        "operation": operation,
        "explanation": explanation,
        "returnValue": return_value,
    }
