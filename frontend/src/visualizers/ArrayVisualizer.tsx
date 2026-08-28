import type { Structure } from '../types/schema'
import { CellRow } from './shared/CellRow'

export interface ArrayVisualizerProps {
  structure: Structure
}

/**
 * Renders a `structures[]` entry with type "array": bordered cells with
 * index labels, animated pointer arrows, current/active/visited highlight
 * colors, and a WINDOW bracket when `window` is set.
 *
 * Keyed by `structure.id` at the call site (VisualizerDispatcher) so this
 * component and its cells persist across steps instead of remounting -
 * only highlight/pointer/window props change.
 */
export function ArrayVisualizer({ structure }: ArrayVisualizerProps) {
  return (
    <div className="visualizer-panel">
      <div className="visualizer-panel__header">
        <span className="visualizer-panel__title">{structure.id}</span>
        <span className="visualizer-panel__badge">array</span>
      </div>
      <div className="visualizer-panel__body">
        <CellRow structure={structure} variant="array" />
      </div>
    </div>
  )
}
