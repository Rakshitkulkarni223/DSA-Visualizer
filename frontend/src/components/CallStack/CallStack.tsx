import type { CallFrame, JsonValue, StepSnapshot } from '../../types/schema'

export interface CallStackProps {
  step: StepSnapshot | null
}

function formatValue(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Renders `currentStep.callStack` as a stack of frames, per the spec's
 * "factorial call stack" visual. CONTRACT.md doesn't specify array order,
 * so this assumes `callStack[0]` is the outermost caller and the last entry
 * is the innermost/current frame (matching how a Python trace naturally
 * appends frames as calls go deeper) - rendered top-to-bottom with the
 * innermost frame on top and visually highlighted as "current".
 */
export function CallStack({ step }: CallStackProps) {
  const frames: CallFrame[] = step?.callStack ?? []
  const reversed = [...frames].reverse()

  return (
    <div className="panel call-stack">
      <h3 className="panel__heading">Call Stack</h3>
      {reversed.length === 0 ? (
        <p className="panel__empty-note">No active calls.</p>
      ) : (
        <ul className="call-stack__frames">
          {reversed.map((frame, i) => {
            const isCurrent = i === 0
            const localEntries = Object.entries(frame.locals ?? {})
            return (
              <li
                key={`${frame.function}-${frames.length - 1 - i}`}
                className={`call-stack__frame${isCurrent ? ' call-stack__frame--current' : ''}`}
              >
                <div className="call-stack__frame-header">
                  <span className="call-stack__frame-fn">{frame.function}()</span>
                  <span className="call-stack__frame-line">line {frame.line}</span>
                </div>
                {localEntries.length > 0 && (
                  <div className="call-stack__frame-locals">
                    {localEntries.map(([name, value]) => (
                      <span key={name} className="call-stack__local">
                        {name}={formatValue(value)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
