# Architecture

See `CONTRACT.md` for the binding API/schema contract — read that first.

## System flow

```
React (Vite) ── POST /api/visualize ──> FastAPI
                                           │
                                    app/api/routes.py
                                           │
                                   app/execution/executor.py
                                     │              │
                          app/analysis/*      app/execution/sandbox_runner.py
                          (AST hints,               │ (subprocess, rlimits,
                           pre-execution)            │  timeout, MAX_STEPS)
                                     │              │
                                     └──> app/execution/wrapper.py
                                              (builds callable entrypoint:
                                               function or Solution().method)
                                                     │
                                          app/execution/tracer.py
                                              (sys.settrace, StepSnapshot[])
                                                     │
                                   app/analysis/structure_detector.py
                                   app/analysis/algorithm_detector.py
                                              (enrich steps + detected[])
                                                     │
                                       app/models/schemas.py (Pydantic)
                                                     │
                                        JSON response ──> React
                                                            │
                                          engine/timeline.ts, stateManager.ts
                                                            │
                                    VisualizerDispatcher -> ArrayVisualizer /
                                    StringVisualizer / GenericVisualizer
```

## Why a subprocess, not in-process exec()

User code runs in a separate Python process (`sandbox_runner.py`) so a crash,
infinite loop, or resource-limit kill never takes down the FastAPI server.
`executor.py` owns the subprocess lifecycle (spawn, timeout, parse result).
Swapping this subprocess for a Docker container / Judge0 call later is a
contained change inside `executor.py` + `sandbox_runner.py` — nothing else in
the codebase should need to know how sandboxing is implemented.

## Why structure vs. visual state are separate

`StepSnapshot.structures[]` is the STRUCTURE + its CURRENT VALUES. Frontend
visualizers key their React nodes by `structures[].id` and are *diffed*
step-to-step (pointer moved, cell highlighted) — never unmounted/remounted.
This is the persistent-visualization rule from the product spec: the whole
structure stays on screen for the life of the run, only pointers/highlights
animate.

## Extensibility for Phase 2 visualizers

Adding Stack/Queue/LinkedList/Tree/Graph/Heap/Trie/DP/Matrix/Recursion/
Backtracking is meant to be additive, not a rewrite:

- Backend: add a new `type` to `structure_detector.py`'s output vocabulary,
  populate `structures[]` entries of that type with whatever extra fields that
  visualizer needs (e.g. `edges` for graphs, `children`/`left`/`right` ids for
  trees). Extend `CONTRACT.md` with the new structure shape before writing
  code against it.
- Frontend: implement the real visualizer in the already-scaffolded stub file
  under `src/visualizers/`, then add one line to `VisualizerDispatcher.tsx`'s
  type→component lookup map.

## Folder map

```
backend/app/
  api/routes.py            POST /api/visualize, GET /api/examples
  execution/
    wrapper.py              build entrypoint call (function or Solution().method)
    tracer.py                sys.settrace -> StepSnapshot[]
    sandbox_runner.py        subprocess entry, rlimits, MAX_STEPS
    executor.py               orchestrates subprocess + detection + response
  analysis/
    ast_parser.py            static hints (recursion, classes, loops...)
    structure_detector.py    array/string/generic + Phase 2 types later
    algorithm_detector.py    two_pointer/sliding_window/binary_search/...
  state/                     snapshot + serializer helpers (JSON-safety)
  models/schemas.py          Pydantic request/response models

frontend/src/
  components/                panel UI: CodeEditor, InputEditor, OutputPanel,
                              VariablesPanel, CallStack, Timeline, Controls,
                              AlgorithmFlow, StepExplanation, Complexity
  visualizers/                ArrayVisualizer, StringVisualizer,
                              GenericVisualizer + Phase 2 stubs
  engine/                     timeline.ts, stateManager.ts, animation.ts
  api/client.ts               fetch wrapper matching CONTRACT.md
  types/schema.ts             single source of truth TS types
  examples/                   ExamplePicker + fixtures
```

## Roadmap (explicitly deferred, see CONTRACT.md "Non-goals")

Phase 2: Stack, Queue, LinkedList visualizers.
Phase 3: Tree (BST/traversals), Graph (BFS/DFS/Dijkstra).
Phase 4: DP (1D/2D tables with dependency arrows), Recursion tree, Memoization view.
Phase 5: Backtracking decision tree, Heap, Trie, Matrix/grid.
Phase 6: Compare Algorithms side-by-side, random input generator, multi-language.

Each phase should start by extending `CONTRACT.md`'s structure vocabulary and
schema, then implement backend detection + frontend visualizer together.
