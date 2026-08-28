import type { JsonValue, StepSnapshot } from '../../types/schema'

export interface VariablesPanelProps {
  step: StepSnapshot | null
}

// Types that already get a dedicated visualizer in VisualizerDispatcher -
// skip re-listing their raw values here to avoid duplicating the main
// visualization panel.
const VISUALIZED_TYPES = new Set(['array', 'string'])

function formatValue(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Always-rendered key/value table of `currentStep.variables`, plus a nested
 * "Structures" section for any structure whose `values` aren't already
 * shown by a dedicated visualizer (e.g. Phase 2 types, or a "generic"
 * structure without its own panel).
 */
export function VariablesPanel({ step }: VariablesPanelProps) {
  if (!step) {
    return (
      <div className="panel variables-panel">
        <h3 className="panel__heading">Variables</h3>
        <p className="panel__empty-note">No run loaded yet.</p>
      </div>
    )
  }

  const variableEntries = Object.entries(step.variables ?? {})
  const unvisualizedStructures = step.structures.filter(
    (structure) => !VISUALIZED_TYPES.has(structure.type),
  )

  return (
    <div className="panel variables-panel">
      <h3 className="panel__heading">Variables</h3>
      {variableEntries.length === 0 ? (
        <p className="panel__empty-note">No variables in scope.</p>
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

      {unvisualizedStructures.length > 0 && (
        <div className="variables-panel__structures">
          <h4 className="panel__subheading">Structures</h4>
          {unvisualizedStructures.map((structure) => (
            <div key={structure.id} className="variables-panel__structure">
              <span className="variables-panel__structure-name">
                {structure.id} <em>({structure.type})</em>
              </span>
              <span className="variables-panel__structure-values">
                {structure.values.map(formatValue).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
