# DSA Visualizer — Project Rules

A generic Python DSA code execution + tracing + visualization platform. Paste
(almost) any Python code, give input, click Visualize, and step through
execution with a persistent, always-visible visualization. This is **not** a
collection of hard-coded algorithm demos — it's a generic tracer/visualizer
engine with specialized visualizers layered on top.

Read `docs/CONTRACT.md` before touching the API shape or the `StepSnapshot`
schema — it is the binding agreement between backend and frontend. Read
`docs/ARCHITECTURE.md` for the system flow and folder map.

## Design principles (non-negotiable, from the product spec)

1. **Visualization is persistent.** The full structure (array/tree/graph/...)
   renders once and stays on screen for the entire run. Never unmount/remount
   it between steps — only pointers, highlights, and values change. Frontend
   visualizers must key React nodes by a stable structure `id` for this
   reason.
2. **State changes, structure stays.** Separate "what the structure is" from
   "what's currently highlighted/pointed-to."
3. **Show why, not only what.** Step explanations should say *why* a value
   changed (e.g. "17 > 9, so right moves left"), not just that it changed.
4. **Code and visualization stay synchronized.** The current source line is
   always highlighted and matches the current step's visualization state.
5. **Generic fallback is mandatory.** Any valid Python program must produce
   at least a Variables + Call Stack view, even with zero detected DSA
   structures.
6. **Never pretend detection is perfect.** Every structure/algorithm
   detection carries a confidence score; low-confidence results are labeled
   "possible pattern" or omitted (< 0.5), never asserted as fact. Complexity
   estimates are always labeled `estimated: true`.
7. **Prefer simple, understandable animations over flashy ones.**
8. **This is a learning tool, not a debugger.** Favor clarity and
   explanation over raw internals.

## Phasing

Do not build every visualizer at once. Phase 1 (current) = generic engine +
Array/String visualizers + Two Sum/Binary Search/Sliding Window/Factorial
examples. Later phases (Stack, Queue, LinkedList, Tree, Graph, DP, Heap,
Trie, Matrix, Recursion tree, Backtracking, Compare Algorithms) are scaffolded
as stubs and implemented one at a time — see `docs/ARCHITECTURE.md` roadmap.
When starting a new phase: extend `docs/CONTRACT.md`'s structure vocabulary
first, then implement backend detection and the frontend visualizer together
against that update.

## Security

User-submitted code executes ONLY inside `backend/app/execution/sandbox_runner.py`,
run as a separate subprocess with CPU/memory rlimits, a wall-clock timeout,
and a hard `MAX_STEPS` cap enforced inside the tracer. Never execute user code
in-process in the FastAPI app. Never remove or loosen these limits to "make a
test pass" — fix the underlying tracer/timeout logic instead.

## Running locally

Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`
Frontend: `cd frontend && npm install && npm run dev` (expects backend on `http://localhost:8000`, configurable via `frontend/.env`)

## Conventions

- Backend: Python 3, FastAPI, Pydantic v2. Type hints everywhere. New
  detection logic belongs in `app/analysis/`, never inline in `routes.py`.
- Frontend: React + TypeScript + Vite. All shared types live in
  `src/types/schema.ts` — do not redefine `StepSnapshot`/`Structure` shapes
  locally in a component.
- Every new structure type added to the detection vocabulary must be
  documented in `docs/CONTRACT.md` in the same change that introduces it.
