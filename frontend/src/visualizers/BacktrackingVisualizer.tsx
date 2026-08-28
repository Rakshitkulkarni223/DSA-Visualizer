// PHASE 2
// Stub only - not wired into VisualizerDispatcher's active registry.
// Real Backtracking visualization logic is out of scope for Phase 1
// (see docs/CONTRACT.md "Non-goals for Phase 1").

import type { Structure } from '../types/schema'

export interface BacktrackingVisualizerProps {
  structure: Structure
}

export function BacktrackingVisualizer({ structure }: BacktrackingVisualizerProps) {
  return (
    <div className="visualizer-panel visualizer-panel--stub">
      <div className="visualizer-panel__header">
        <span className="visualizer-panel__title">{structure.id}</span>
        <span className="visualizer-panel__badge">backtracking</span>
      </div>
      <div className="visualizer-panel__body">
        <p>Coming soon — Phase 2</p>
      </div>
    </div>
  )
}
