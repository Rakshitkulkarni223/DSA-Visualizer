"""
The tracing engine. Uses sys.settrace to observe `line`, `call`, `return`,
and `exception` events strictly inside the user's own code (frames whose
co_filename matches the fixed script filename -- stdlib/framework frames are
never visited), and turns each observed event into a normalized StepSnapshot
via app.state.snapshot. Enforces MAX_STEPS via app.state.state_engine so a
runaway loop can't produce unbounded output.
"""
from __future__ import annotations

import sys
from typing import Any, Optional

from app.state.serializer import is_class_body_frame, to_json_safe
from app.state.snapshot import make_step_snapshot
from app.state.state_engine import MAX_STEPS, StateEngine, StepLimitExceeded

__all__ = ["run_traced", "StepLimitExceeded", "MAX_STEPS"]


def _derive_operation(line_text: str, event: str, return_value: Any = None) -> tuple[Optional[dict], Optional[str]]:
    """Best-effort short natural-language description of the current step,
    derived from the raw source line text. Intentionally simple pattern
    matching -- not a real parser -- since this is purely cosmetic."""
    text = line_text.strip()
    if not text:
        return None, None

    if event == "call":
        return {"type": "call", "description": f"Entering: {text}"}, f"Calling into: {text}"
    if event == "return":
        desc = f"return {return_value!r}" if return_value is not None else "return"
        return {"type": "return", "description": desc}, f"Returning {return_value!r}"
    if event == "exception":
        return {"type": "exception", "description": text}, f"Exception raised while executing: {text}"

    # event == "line"
    if text.startswith(("for ", "while ")):
        return {"type": "loop", "description": text}, f"Loop step: {text}"
    if text.startswith(("if ", "elif ")):
        return {"type": "branch", "description": text}, f"Checking condition: {text}"
    if text.startswith("return"):
        return {"type": "return", "description": text}, f"Preparing to return: {text}"
    for op in ("+=", "-=", "*=", "//=", "/="):
        if op in text:
            return {"type": "update", "description": text}, f"Updating value: {text}"
    if "==" in text or " is " in text or "!=" in text:
        return {"type": "compare", "description": text}, f"Comparing: {text}"
    if "=" in text and "==" not in text:
        return {"type": "assign", "description": text}, f"Assigning: {text}"
    return {"type": "statement", "description": text}, f"Executing: {text}"


def run_traced(compiled_code, exec_globals: dict, filename: str, source: str, max_steps: int = MAX_STEPS) -> StateEngine:
    """
    Execute `compiled_code` (compiled from `source` with co_filename ==
    `filename`) under sys.settrace, recording a normalized StepSnapshot for
    every line/call/return/exception event inside frames whose filename
    matches `filename`.

    Returns the StateEngine holding the collected steps (check
    `engine.truncated` to know whether MAX_STEPS was hit). Any exception
    raised by the user's own code (IndexError, etc.) propagates out of this
    function so the caller can classify it as a runtime error.
    """
    source_lines = source.splitlines()
    engine = StateEngine(max_steps=max_steps)
    step_count = 0

    def local_trace(frame, event, arg):
        nonlocal step_count
        if frame.f_code.co_filename != filename:
            return None
        if event not in ("line", "call", "return", "exception"):
            return local_trace
        if is_class_body_frame(frame):
            # Class body execution (defining methods) isn't a real call --
            # skip it entirely rather than emitting a misleading step.
            return local_trace
        if frame.f_code.co_name == "<module>" and event in ("call", "return"):
            # The module's own enter/exit bookends aren't meaningful steps;
            # its "line" events (top-level statements) still are.
            return local_trace

        step_count += 1
        line = frame.f_lineno
        line_text = source_lines[line - 1] if 0 < line <= len(source_lines) else ""

        return_value = None
        if event == "return":
            return_value = to_json_safe(arg)
        elif event == "exception":
            exc_type, exc_value, _tb = arg
            if not line_text:
                line_text = f"{exc_type.__name__}: {exc_value}"

        operation, explanation = _derive_operation(line_text, event, return_value)
        snapshot = make_step_snapshot(
            step=step_count,
            line=line,
            event=event,
            frame=frame,
            filename=filename,
            operation=operation,
            explanation=explanation,
            return_value=return_value,
        )
        engine.add(snapshot)  # raises StepLimitExceeded once max_steps is hit
        return local_trace

    def global_trace(frame, event, arg):
        if event != "call" or frame.f_code.co_filename != filename:
            return None
        return local_trace(frame, event, arg)

    old_trace = sys.gettrace()
    sys.settrace(global_trace)
    try:
        exec(compiled_code, exec_globals)
    except StepLimitExceeded:
        pass  # engine.truncated is already set; stop cleanly, no partial re-raise
    finally:
        sys.settrace(old_trace)
    return engine
