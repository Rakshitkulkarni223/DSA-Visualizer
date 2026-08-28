"""
Orchestrates one /api/visualize request: AST-analyze the code, spawn the
sandbox subprocess to actually run + trace it, then enrich the returned
steps with structure/algorithm detection and a rough complexity estimate.

Design note -- where detection runs:
Structure detection (app.analysis.structure_detector) and algorithm
detection (app.analysis.algorithm_detector) both run HERE, in the parent
FastAPI process, AFTER the sandbox subprocess has already finished and
returned. The subprocess only ever hands back JSON-safe primitives (see
app.state.serializer) -- plain lists/dicts/ints/strings -- which is exactly
what structure detection needs (list-of-number/str shape, current index
values, pointer values). Running detection here means it never touches a
live, attacker-controlled Python object, at the small cost of losing native
type distinctions (tuple vs list vs set, custom classes) that are already
flattened to JSON-safe shapes before crossing the process boundary. Algorithm
detection is pure AST analysis of the submitted source text and never touches
runtime data at all, so it always runs in the parent regardless.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import Any, Optional

from app.analysis.algorithm_detector import detect_algorithms
from app.analysis.ast_parser import CodeAnalysis, analyze_code
from app.analysis.structure_detector import enrich_steps_with_structures

DEFAULT_TIMEOUT_SECONDS = 5
MAX_STEPS = 10000

# backend/ directory: the subprocess is spawned with this as its cwd so that
# `python -m app.execution.sandbox_runner` can resolve the `app` package.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _error_response(status: str, message: str, line: Optional[int] = None, detail: Optional[str] = None) -> dict:
    return {"status": status, "message": message, "line": line, "detail": detail}


def _estimate_complexity(analysis: CodeAnalysis) -> dict:
    """Very rough, best-effort estimate from AST shape alone. Always marked
    `estimated: true` -- never claim certainty."""
    all_callables = analysis.all_callables
    recursive = [c for c in all_callables if c.is_recursive]

    if recursive:
        rc = recursive[0]
        if rc.has_memo:
            return {
                "time": "O(n)",
                "space": "O(n)",
                "explanation": "Recursive with an apparent memo/cache dict; estimated as linear.",
                "estimated": True,
            }
        if rc.recursive_call_count >= 2:
            return {
                "time": "O(2^n)",
                "space": "O(n)",
                "explanation": "Multiple recursive calls per invocation with no memoization detected; likely exponential.",
                "estimated": True,
            }
        return {
            "time": "O(n)",
            "space": "O(n)",
            "explanation": "Single recursive call per invocation; linear time, call-stack space.",
            "estimated": True,
        }

    max_depth = max([c.loop_depth for c in all_callables] + [0])
    if max_depth >= 2:
        return {
            "time": f"O(n^{max_depth})",
            "space": "O(1)",
            "explanation": f"{max_depth} nested loops detected; polynomial time estimate.",
            "estimated": True,
        }
    if max_depth == 1:
        return {
            "time": "O(n)",
            "space": "O(1)",
            "explanation": "Single loop over the input detected.",
            "estimated": True,
        }
    return {
        "time": "O(1)",
        "space": "O(1)",
        "explanation": "No loops or recursion detected; low-confidence constant-time estimate.",
        "estimated": True,
    }


def run_visualize(code: str, input_data: dict, expected_output: Any, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> dict:
    try:
        analysis = analyze_code(code)
    except SyntaxError as e:
        return _error_response(
            "syntax_error",
            f"Syntax error in submitted code: {e.msg}",
            line=e.lineno,
            detail=str(e),
        )

    payload = json.dumps({"code": code, "input": input_data or {}})
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "app.execution.sandbox_runner"],
            input=payload,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=_BACKEND_DIR,
        )
    except subprocess.TimeoutExpired:
        return _error_response(
            "timeout",
            f"Execution exceeded the {timeout}s time limit.",
        )

    try:
        result = json.loads(proc.stdout)
    except (json.JSONDecodeError, ValueError):
        return _error_response(
            "runtime_error",
            "Sandbox process produced no valid output.",
            detail=(proc.stderr or proc.stdout or "")[:2000],
        )

    if result.get("status") != "success":
        # Already in the error response shape (syntax_error / runtime_error /
        # step_limit_exceeded) -- pass it straight through.
        return {
            "status": result.get("status", "runtime_error"),
            "message": result.get("message", "Unknown error."),
            "line": result.get("line"),
            "detail": result.get("detail"),
        }

    steps = result.get("steps", [])
    enrich_steps_with_structures(steps, analysis, code)

    detected: list = []
    struct_confidence: dict = {}
    for step in steps:
        for s in step.get("structures", []):
            stype = s["type"]
            has_activity = bool(s.get("pointers")) or bool(s.get("highlights", {}).get("active"))
            confidence = 0.95 if has_activity else 0.8
            struct_confidence[stype] = max(struct_confidence.get(stype, 0.0), confidence)
    for stype, confidence in struct_confidence.items():
        if stype != "generic" and confidence >= 0.5:
            detected.append({"type": stype, "confidence": round(confidence, 2)})

    detected.extend(detect_algorithms(code, analysis))

    output = result.get("output")
    output_matches = None
    if expected_output is not None:
        output_matches = output == expected_output

    complexity = _estimate_complexity(analysis)

    return {
        "status": "success",
        "output": output,
        "expectedOutput": expected_output,
        "outputMatches": output_matches,
        "detected": detected,
        "complexity": complexity,
        "steps": steps,
        "truncated": result.get("truncated", False),
        "maxSteps": MAX_STEPS,
    }
