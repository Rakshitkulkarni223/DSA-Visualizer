# DSA Visualizer Backend

FastAPI backend implementing the pipeline in `../docs/CONTRACT.md`:
AST analysis -> sandboxed subprocess execution -> `sys.settrace` tracing ->
normalized step snapshots -> structure/algorithm detection -> JSON response.

## Install

```bash
cd backend
python3 -m venv .venv        # optional but recommended
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- `POST /api/visualize` — run + trace submitted code, see `docs/CONTRACT.md` for the request/response shape.
- `GET /api/examples` — the Phase 1 example library.
- `GET /health` — liveness check.

## Test

```bash
pytest
```

## Layout

- `app/models/schemas.py` — Pydantic v2 request/response models.
- `app/analysis/ast_parser.py` — static AST analysis (no execution).
- `app/analysis/structure_detector.py` — array/string/generic detection.
- `app/analysis/algorithm_detector.py` — two_pointer/sliding_window/binary_search/recursion/iteration detection.
- `app/execution/wrapper.py` — builds the runnable script + call for the detected entry point.
- `app/execution/tracer.py` — `sys.settrace`-based tracing engine.
- `app/execution/sandbox_runner.py` — standalone subprocess entry point (`python -m app.execution.sandbox_runner`).
- `app/execution/executor.py` — orchestrates the subprocess call + detection + complexity estimate.
- `app/state/` — JSON-safety coercion, snapshot building, step-count bookkeeping.
- `app/examples_data.py` — the 4 shipped examples.
