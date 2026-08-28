"""
JSON-safety coercion. This is the canonical home for turning arbitrary live
Python objects encountered while tracing user code into the JSON-safe shapes
CONTRACT.md requires. tracer.py / snapshot.py import from here rather than
re-implementing this logic (single source of truth).
"""
from __future__ import annotations

from typing import Any

_MAX_DEPTH = 6
_MAX_ITEMS = 500

# inspect.CO_NEWLOCALS: set on function/method code objects, NOT on module or
# class-body code objects (both execute directly into a namespace dict rather
# than getting fresh fast-locals). Used to filter out the spurious
# "call Solution" / "return Solution" trace events CPython emits while
# executing a class body -- not a real function call, just noise for
# visualization purposes. Lives here (rather than in tracer.py or
# snapshot.py) so both can import it without a circular dependency.
_CO_NEWLOCALS = 0x0002


def is_class_body_frame(frame) -> bool:
    return frame.f_code.co_name != "<module>" and not (frame.f_code.co_flags & _CO_NEWLOCALS)


def to_json_safe(value: Any, _depth: int = 0) -> Any:
    if _depth > _MAX_DEPTH:
        return {"__repr__": _safe_repr(value)}

    if value is None or isinstance(value, (bool, int, float, str)):
        return value

    if isinstance(value, dict):
        return {
            _safe_key(k): to_json_safe(v, _depth + 1)
            for k, v in list(value.items())[:_MAX_ITEMS]
        }

    if isinstance(value, list):
        return [to_json_safe(v, _depth + 1) for v in value[:_MAX_ITEMS]]

    if isinstance(value, tuple):
        return [to_json_safe(v, _depth + 1) for v in value[:_MAX_ITEMS]]

    if isinstance(value, (set, frozenset)):
        try:
            items = sorted(value)
        except TypeError:
            items = list(value)
        return [to_json_safe(v, _depth + 1) for v in items[:_MAX_ITEMS]]

    # Simple custom object with a __dict__: surface its attributes plus a
    # repr, recursively coerced. Anything else (functions, modules, sockets,
    # etc.) just becomes a repr string.
    if hasattr(value, "__dict__"):
        try:
            attrs = {
                k: to_json_safe(v, _depth + 1)
                for k, v in vars(value).items()
                if not k.startswith("__")
            }
            attrs["__repr__"] = _safe_repr(value)
            return attrs
        except Exception:
            return {"__repr__": _safe_repr(value)}

    return {"__repr__": _safe_repr(value)}


def _safe_key(key: Any) -> str:
    try:
        return str(key)
    except Exception:
        return "<unrepresentable key>"


def _safe_repr(value: Any) -> str:
    try:
        return repr(value)
    except Exception:
        return "<unrepr-able object>"


def coerce_locals(locals_dict: dict) -> dict:
    """Coerce a frame's f_locals into a JSON-safe dict, dropping dunder /
    internal sentinel names (e.g. __INPUT__, __RESULT__, __builtins__) that
    are implementation detail, not user variables."""
    return {
        k: to_json_safe(v)
        for k, v in locals_dict.items()
        if not k.startswith("__")
    }
