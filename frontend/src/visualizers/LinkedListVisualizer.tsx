// PHASE 2
// Stub only - not wired into VisualizerDispatcher's active registry.
// Real LinkedList visualization logic is out of scope for Phase 1
// (see docs/CONTRACT.md "Non-goals for Phase 1").

import type { Structure } from '../types/schema'

export interface LinkedListVisualizerProps {
  structure: Structure
}

export function LinkedListVisualizer({ structure }: LinkedListVisualizerProps) {
  return (
    <div className="visualizer-panel visualizer-panel--stub">
      <div className="visualizer-panel__header">
        <span className="visualizer-panel__title">{structure.id}</span>
        <span className="visualizer-panel__badge">linked_list</span>
      </div>
      <div className="visualizer-panel__body">
        <p>Coming soon — Phase 2</p>
      </div>
    </div>
  )
}
