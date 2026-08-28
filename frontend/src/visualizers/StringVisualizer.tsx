import type { Structure } from '../types/schema'
import { CellRow } from './shared/CellRow'

export interface StringVisualizerProps {
  structure: Structure
}

/**
 * Renders a `structures[]` entry with type "string": same mechanics as
 * ArrayVisualizer (pointers, highlights, window) but each cell displays a
 * character rather than a number. Shares the CellRow implementation.
 *
 * Assumption (CONTRACT.md doesn't spell this out): a "string" structure's
 * `values` array is the list of individual characters, mirroring how
 * "array" structures list elements - keeps one rendering path for both.
 */
export function StringVisualizer({ structure }: StringVisualizerProps) {
  return (
    <div className="visualizer-panel">
      <div className="visualizer-panel__header">
        <span className="visualizer-panel__title">{structure.id}</span>
        <span className="visualizer-panel__badge">string</span>
      </div>
      <div className="visualizer-panel__body">
        <CellRow structure={structure} variant="string" />
      </div>
    </div>
  )
}
