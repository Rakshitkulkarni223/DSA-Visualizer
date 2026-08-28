import type { JsonValue, StepSnapshot, Structure } from '../types/schema'

export interface GenericVisualizerProps {
  /** Current step, or null when no run is loaded yet. */
  step: StepSnapshot | null
  /**
   * When set, this is a single structure of an unrecognized/unregistered
   * `type` that VisualizerDispatcher fell back to rendering generically
   * (e.g. a future Phase 2 type used before its real visualizer is wired
   * in). When omitted, this renders the "no structures at all" fallback
   * for the whole step (plain variables).
   */
  structure?: Structure
}

function formatValue(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * MANDATORY fallback visualizer - always works, never throws, never shows a
 * blank panel. Used by VisualizerDispatcher in two situations:
 *  1. No structure with sufficient confidence was detected at all - render
 *     the step's plain variables as key/value pairs.
 *  2. A structure exists but its `type` has no registered visualizer yet
 *     (e.g. a Phase 2 type) - render that structure's raw values/pointers
 *     generically instead of dropping it silently.
 */
export function GenericVisualizer({ step, structure }: GenericVisualizerProps) {
  if (structure) {
    return (
      <div className="visualizer-panel generic-visualizer">
        <div className="visualizer-panel__header">
          <span className="visualizer-panel__title">{structure.id}</span>
          <span className="visualizer-panel__badge">{structure.type} (generic)</span>
        </div>
        <div className="visualizer-panel__body">
          <div className="generic-visualizer__values">
            {structure.values.map((value, index) => (
              <span key={index} className="generic-visualizer__chip">
                {formatValue(value)}
              </span>
            ))}
          </div>
          {Object.keys(structure.pointers ?? {}).length > 0 && (
            <div className="generic-visualizer__pointers">
              {Object.entries(structure.pointers).map(([name, index]) => (
                <span key={name} className="generic-visualizer__chip generic-visualizer__chip--pointer">
                  {name} = {index}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!step) {
    return (
      <div className="visualizer-panel generic-visualizer generic-visualizer--empty">
        <p>No run loaded yet. Write some code and click Run.</p>
      </div>
    )
  }

  const variableEntries = Object.entries(step.variables ?? {})

  return (
    <div className="visualizer-panel generic-visualizer">
      <div className="visualizer-panel__header">
        <span className="visualizer-panel__title">Variables</span>
        <span className="visualizer-panel__badge">generic</span>
      </div>
      <div className="visualizer-panel__body">
        {variableEntries.length === 0 ? (
          <p className="generic-visualizer__empty-note">No variables in scope at this step.</p>
        ) : (
          <table className="kv-table">
            <tbody>
              {variableEntries.map(([name, value]) => (
                <tr key={name}>
                  <td className="kv-table__key">{name}</td>
                  <td className="kv-table__value">{formatValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
