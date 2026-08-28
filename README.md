# DSA Visualizer

A generic Python DSA code execution + tracing + visualization platform.

Paste (almost) any Python DSA/algorithm code, provide input (and optionally
expected output), and the app executes it safely, traces every step, detects
data structures and algorithm patterns, and lets you step through a
persistent, always-visible visualization — synced to the highlighted source
line.

This is a generic execution/tracing engine, not a set of hard-coded algorithm
demos. See `docs/CONTRACT.md` for the API/schema contract and
`docs/ARCHITECTURE.md` for the system design. See `CLAUDE.md` for project
rules and design principles.

## Quick start

```bash
# backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open the frontend dev server URL, paste code, provide JSON input, click
Visualize.

## Status

Phase 1: generic tracer + Array/String visualizers + example library (Two
Sum, Binary Search, Sliding Window, Factorial recursion). See
`docs/ARCHITECTURE.md` for the phased roadmap (Stack/Queue/LinkedList, Tree/
Graph, DP, Backtracking/Heap/Trie/Matrix, Compare Algorithms).
