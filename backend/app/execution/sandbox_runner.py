"""
Standalone sandboxed entry point: `python -m app.execution.sandbox_runner`.

Reads ONE JSON payload from stdin: {"code": "...", "input": {...}}. Applies
POSIX resource limits (CPU time, address space) before running any user
code, executes the user's code through the tracer, and prints exactly ONE
JSON object to stdout:

    {"status": "success", "output": ..., "steps": [...], "truncated": bool}
    {"status": "syntax_error" | "runtime_error" | "step_limit_exceeded",
     "message": "...", "line": <int|null>, "detail": "..."}

This module is executed as a subprocess by app.execution.executor and must
stay import-light (no FastAPI/pydantic) so it is safe to run in isolation.

PHASE 2 (production hardening): this subprocess boundary is exactly where a
Docker/gVisor container would slot in -- executor.py would swap the
`subprocess.run([sys.executable, "-m", ...])` invocation for "run this same
module, with this same stdin/stdout JSON contract, inside a container" and
nothing else in the pipeline would need to change.
"""
from __future__ import annotations

import io
import json
import sys
import traceback

MAX_STDOUT_BYTES = 64 * 1024
CPU_TIME_LIMIT_SECONDS = 5
ADDRESS_SPACE_LIMIT_BYTES = 512 * 1024 * 1024

try:
    import resource  # POSIX only
except ImportError:  # pragma: no cover - non-POSIX (e.g. Windows)
    resource = None


def _apply_resource_limits() -> None:
    """Best-effort; skips gracefully on non-POSIX platforms or when the
    limits can't be lowered further (e.g. already constrained by a parent)."""
    if resource is None:
        return
    try:
        resource.setrlimit(resource.RLIMIT_CPU, (CPU_TIME_LIMIT_SECONDS, CPU_TIME_LIMIT_SECONDS))
    except (ValueError, OSError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_AS, (ADDRESS_SPACE_LIMIT_BYTES, ADDRESS_SPACE_LIMIT_BYTES))
    except (ValueError, OSError):
        pass


def _run(code: str, input_data: dict) -> dict:
    from app.analysis.ast_parser import analyze_code
    from app.execution.wrapper import USER_CODE_FILENAME, build_traceable_script
    from app.execution.tracer import MAX_STEPS, run_traced
    from app.state.serializer import to_json_safe

    try:
        analysis = analyze_code(code)
    except SyntaxError as e:
        return {
            "status": "syntax_error",
            "message": f"Syntax error in submitted code: {e.msg}",
            "line": e.lineno,
            "detail": str(e),
        }

    try:
        script, _entry = build_traceable_script(code, analysis, input_data or {})
    except ValueError as e:
        return {"status": "runtime_error", "message": str(e), "line": None, "detail": str(e)}

    try:
        compiled = compile(script, USER_CODE_FILENAME, "exec")
    except SyntaxError as e:
        return {
            "status": "syntax_error",
            "message": f"Syntax error in submitted code: {e.msg}",
            "line": e.lineno,
            "detail": str(e),
        }

    exec_globals: dict = {"__name__": "__user_code__", "__INPUT__": input_data or {}}

    old_stdout = sys.stdout
    captured_stdout = io.StringIO()
    sys.stdout = captured_stdout
    try:
        engine = run_traced(compiled, exec_globals, USER_CODE_FILENAME, script, max_steps=MAX_STEPS)
    except Exception as exc:
        tb = traceback.extract_tb(sys.exc_info()[2])
        line = None
        for frame_summary in tb:
            if frame_summary.filename == USER_CODE_FILENAME:
                line = frame_summary.lineno
        return {
            "status": "runtime_error",
            "message": f"{type(exc).__name__}: {exc}",
            "line": line,
            "detail": "".join(traceback.format_exception_only(type(exc), exc)).strip(),
        }
    finally:
        sys.stdout = old_stdout

    if engine.truncated:
        return {
            "status": "step_limit_exceeded",
            "message": f"Execution exceeded MAX_STEPS ({MAX_STEPS}); likely an infinite loop.",
            "line": None,
            "detail": None,
        }

    result_value = exec_globals.get("__RESULT__")
    return {
        "status": "success",
        "output": to_json_safe(result_value),
        "steps": engine.steps,
        "truncated": engine.truncated,
        "stdout": captured_stdout.getvalue()[:MAX_STDOUT_BYTES],
    }


def main() -> None:
    _apply_resource_limits()
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({
            "status": "runtime_error",
            "message": "Invalid JSON payload sent to sandbox runner.",
            "line": None,
            "detail": raw[:500],
        }))
        return

    code = payload.get("code", "") or ""
    input_data = payload.get("input") or {}

    try:
        result = _run(code, input_data)
    except MemoryError:
        result = {"status": "runtime_error", "message": "Memory limit exceeded.", "line": None, "detail": "MemoryError"}
    except BaseException as exc:  # last-resort guard: always print exactly one JSON object
        result = {
            "status": "runtime_error",
            "message": "Unexpected sandbox failure.",
            "line": None,
            "detail": f"{type(exc).__name__}: {exc}",
        }

    sys.stdout.write(json.dumps(result))
    sys.stdout.write("\n")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
