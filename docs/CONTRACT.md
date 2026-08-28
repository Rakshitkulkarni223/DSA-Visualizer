# DSA Visualizer — Cross-Cutting Contract (Phase 1 / Milestone 1)

This is the binding contract between backend and frontend. Both sides implement
against this document. Do not deviate without updating this file first.

## Scope of Phase 1 (this build pass)

Implement the full generic pipeline end-to-end:

```
React code/input editors -> POST /api/visualize -> FastAPI
  -> AST analysis -> sandboxed execution -> sys.settrace tracer
  -> normalized step snapshots -> structure/algorithm detection
  -> JSON response -> React timeline + panels -> visualizers
```

Visualizers implemented in Phase 1:
- `GenericVisualizer` (fallback: variables + call stack) — MANDATORY, always works
- `ArrayVisualizer` (list[int]/list[str] detection, pointers, highlights, windows)
- `StringVisualizer` (same mechanics as Array, char cells)

Everything else (Stack, Queue, LinkedList, Tree, Graph, Heap, Trie, DP, Matrix,
Recursion tree, Backtracking tree) is **scaffolded** as an empty typed stub
component/module with a `// PHASE 2` marker and NOT wired into the dispatcher
yet. The visualizer dispatcher must be written so adding one later is a
one-line registration, not a rewrite.

Examples shipped in Phase 1: Two Sum (array/two-pointer), Binary Search
(array), Sliding Window Max Sum (array/window), Factorial (recursion, exercises
GenericVisualizer + call stack). LeetCode `class Solution` style must work for
Two Sum.

## API

### `POST /api/visualize`

Request:
```json
{
  "language": "python",
  "code": "string, required",
  "input": { "any JSON object; keys become kwargs/args by name match" },
  "expectedOutput": "any JSON value, optional"
}
```

Response (success):
```json
{
  "status": "success",
  "output": <any JSON value>,
  "expectedOutput": <any JSON value or null>,
  "outputMatches": true | false | null,
  "detected": [
    { "type": "array", "confidence": 0.98 },
    { "type": "two_pointer", "confidence": 0.91 }
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(1)",
    "explanation": "string",
    "estimated": true
  },
  "steps": [ StepSnapshot, ... ],
  "truncated": false,
  "maxSteps": 10000
}
```

Response (error) — HTTP 200 with status set, so the frontend has one code path:
```json
{
  "status": "syntax_error" | "runtime_error" | "timeout" | "step_limit_exceeded",
  "message": "human readable",
  "line": 12,
  "detail": "IndexError: list index out of range"
}
```

### `GET /api/examples`
Returns the example library (id, title, category, code, input, expectedOutput).

## Normalized Step Snapshot (`StepSnapshot`)

This is the ONLY shape the frontend ever consumes. The frontend must never see
raw Python trace events, frame objects, or internal types.

```json
{
  "step": 12,
  "line": 8,
  "event": "line" | "call" | "return" | "exception",
  "functionName": "two_sum",
  "variables": { "left": 1, "right": 3, "total": 22 },
  "callStack": [
    { "function": "two_sum", "line": 8, "locals": { "left": 1, "right": 3 } }
  ],
  "structures": [
    {
      "id": "nums",
      "type": "array",
      "values": [2, 7, 11, 15],
      "pointers": { "left": 1, "right": 3 },
      "highlights": { "current": [1, 3], "visited": [], "active": [1, 3] },
      "window": null
    }
  ],
  "operation": { "type": "compare", "description": "nums[left] + nums[right] = 22" } | null,
  "explanation": "short natural-language sentence for this step" | null,
  "returnValue": null
}
```

Rules the backend MUST follow when building snapshots:
- `structures` always contains ALL detected structures currently in scope, even
  if unchanged since the previous step (persistent visualization principle —
  the frontend diffs, it does not need the backend to omit unchanged data).
  Values are the CURRENT full value every step (small, since MAX_STEPS caps
  total data and inputs are expected to be small).
- Every value in `variables`/`locals`/structure `values` must be JSON-safe
  (ints, floats, strings, bools, null, lists, dicts). Non-serializable objects
  (custom class instances without a simple `__dict__`) are rendered as
  `{"__repr__": "<...>"}`.
- Structure `id` is stable across the whole run for the same logical variable
  so the frontend can key animations on it (React key = `id`).

## Detection output types (Phase 1 vocabulary)

Structure types: `array`, `string`, `generic`
Algorithm/pattern types: `two_pointer`, `sliding_window`, `binary_search`,
`recursion`, `iteration`

Every detection item has `type` and `confidence` (0..1). Confidence < 0.5 is
omitted from the response entirely (per "never pretend detection is certain").

## Sandboxing (Phase 1 — local dev grade, structured for later hardening)

Execution happens in a **separate Python subprocess** (`python -m
app.execution.sandbox_runner`), never in the FastAPI process:
- `resource.setrlimit` for CPU time and address space (POSIX; skip gracefully
  on non-POSIX).
- Wall-clock timeout via `subprocess` timeout param (default 5s).
- `MAX_STEPS = 10000` enforced inside the tracer itself (raises a sentinel
  exception to unwind cleanly) so a runaway loop can't produce unbounded
  output even within the timeout.
- stdout/stderr from user code captured and size-capped (64KB), not executed
  against real files/network — no import restrictions in Phase 1 dev mode, but
  the module boundary (subprocess) is what production would swap for a Docker
  sandbox per `sandbox.py`'s documented interface.

## Folder ownership

- `backend/` — Python owns everything under here.
- `frontend/` — TypeScript/React owns everything under here.
- `docs/` — shared, either side may update alongside code changes that affect
  the contract (must update this file in the same change).

## Non-goals for Phase 1 (explicitly deferred, do not build now)

Compare Algorithms side-by-side view, DP/Tree/Graph/Heap/Trie/Backtracking
visualizers, random input generator UI, multi-language support. Stub folders
only.
