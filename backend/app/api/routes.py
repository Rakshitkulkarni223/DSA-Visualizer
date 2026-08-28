from __future__ import annotations

from fastapi import APIRouter

from app.examples_data import EXAMPLES
from app.execution.executor import run_visualize
from app.models.schemas import VisualizeRequest

router = APIRouter()


@router.post("/api/visualize")
def visualize(request: VisualizeRequest) -> dict:
    try:
        return run_visualize(
            code=request.code,
            input_data=request.input or {},
            expected_output=request.expectedOutput,
        )
    except Exception as exc:
        # Belt-and-suspenders: run_visualize should already turn user-code
        # failures into a structured error dict, but never let anything
        # escape as a bare 500 -- HTTP 200 with an error status is the
        # contract's single code path for the frontend.
        return {
            "status": "runtime_error",
            "message": "Unexpected backend error while visualizing the submitted code.",
            "line": None,
            "detail": f"{type(exc).__name__}: {exc}",
        }


@router.get("/api/examples")
def get_examples() -> list:
    return EXAMPLES
