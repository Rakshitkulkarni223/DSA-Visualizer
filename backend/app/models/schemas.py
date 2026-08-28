"""
Pydantic v2 models for the request/response shapes defined in docs/CONTRACT.md.

These are the ONLY shapes the frontend ever sees. Keep them in lockstep with
the contract -- if a field here doesn't exist in CONTRACT.md, update the
contract in the same change instead of improvising silently.
"""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class VisualizeRequest(BaseModel):
    language: str = "python"
    code: str
    input: dict[str, Any] = Field(default_factory=dict)
    expectedOutput: Optional[Any] = None


class Detection(BaseModel):
    type: str
    confidence: float


class Complexity(BaseModel):
    time: str
    space: str
    explanation: str
    estimated: bool = True


class CallFrame(BaseModel):
    function: str
    line: int
    locals: dict[str, Any] = Field(default_factory=dict)


class Highlights(BaseModel):
    current: list[int] = Field(default_factory=list)
    visited: list[int] = Field(default_factory=list)
    active: list[int] = Field(default_factory=list)


class Structure(BaseModel):
    id: str
    type: str
    values: Any
    pointers: dict[str, int] = Field(default_factory=dict)
    highlights: Highlights = Field(default_factory=Highlights)
    window: Optional[list[int]] = None


class Operation(BaseModel):
    type: str
    description: str


class StepSnapshot(BaseModel):
    step: int
    line: int
    event: Literal["line", "call", "return", "exception"]
    functionName: Optional[str] = None
    variables: dict[str, Any] = Field(default_factory=dict)
    callStack: list[CallFrame] = Field(default_factory=list)
    structures: list[Structure] = Field(default_factory=list)
    operation: Optional[Operation] = None
    explanation: Optional[str] = None
    returnValue: Optional[Any] = None


class VisualizeSuccessResponse(BaseModel):
    status: Literal["success"] = "success"
    output: Any = None
    expectedOutput: Optional[Any] = None
    outputMatches: Optional[bool] = None
    detected: list[Detection] = Field(default_factory=list)
    complexity: Complexity
    steps: list[StepSnapshot] = Field(default_factory=list)
    truncated: bool = False
    maxSteps: int = 10000


class VisualizeErrorResponse(BaseModel):
    status: Literal["syntax_error", "runtime_error", "timeout", "step_limit_exceeded"]
    message: str
    line: Optional[int] = None
    detail: Optional[str] = None


class ExampleItem(BaseModel):
    id: str
    title: str
    category: str
    code: str
    input: dict[str, Any] = Field(default_factory=dict)
    expectedOutput: Any = None
