// PHASE 2
// Stub only - not wired into VisualizerDispatcher's active registry.
// Real Queue visualization logic is out of scope for Phase 1
// (see docs/CONTRACT.md "Non-goals for Phase 1").

import type { Structure } from '../types/schema'

export interface QueueVisualizerProps {
  structure: Structure
}

export function QueueVisualizer({ structure }: QueueVisualizerProps) {
  return (
    <div className="visualizer-panel visualizer-panel--stub">
      <div className="visualizer-panel__header">
        <span className="visualizer-panel__title">{structure.id}</span>
        <span className="visualizer-panel__badge">queue</span>
      </div>
      <div className="visualizer-panel__body">
        <p>Coming soon — Phase 2</p>
      </div>
    </div>
  )
}
