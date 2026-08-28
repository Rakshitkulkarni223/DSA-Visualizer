"""
Small accumulator that owns the growing step list and enforces MAX_STEPS.
Kept separate from tracer.py so the "how many steps have we recorded, and
when do we stop" bookkeeping has one obvious home.
"""
from __future__ import annotations

MAX_STEPS = 10000


class StepLimitExceeded(BaseException):
    """
    Internal sentinel raised when MAX_STEPS is exceeded, so a runaway loop
    can't produce unbounded step data even within the subprocess timeout.

    Deliberately a BaseException (not Exception): user code that does
    `except Exception:` (very common) must NOT be able to swallow this and
    keep looping forever. This mirrors how KeyboardInterrupt/SystemExit are
    modeled in the standard library.
    """


class StateEngine:
    def __init__(self, max_steps: int = MAX_STEPS):
        self.max_steps = max_steps
        self.steps: list[dict] = []
        self.truncated = False

    def add(self, snapshot: dict) -> None:
        if len(self.steps) >= self.max_steps:
            self.truncated = True
            raise StepLimitExceeded()
        self.steps.append(snapshot)
