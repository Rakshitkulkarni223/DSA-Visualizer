import type { Detection } from '../../types/schema'

export interface AlgorithmFlowProps {
  detected: Detection[]
}

const LOW_CONFIDENCE_THRESHOLD = 0.75

function formatPercent(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

function formatLabel(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Phase 1 minimal version: renders the `detected` badges list
 * (e.g. "Array 98%", "Two Pointer 91%"), with a muted "possible pattern"
 * style when confidence < 0.75.
 *
 * PHASE 2: a full phase-by-phase algorithm flow tracker (highlighting which
 * stage of the detected pattern is currently executing) is out of scope for
 * Phase 1 - this only satisfies the "DETECTED" badge requirement.
 */
export function AlgorithmFlow({ detected }: AlgorithmFlowProps) {
  return (
    <div className="algorithm-flow">
      <span className="algorithm-flow__label">DETECTED</span>
      {detected.length === 0 ? (
        <span className="algorithm-flow__none">No pattern detected</span>
      ) : (
        <div className="algorithm-flow__badges">
          {detected.map((item) => {
            const isLowConfidence = item.confidence < LOW_CONFIDENCE_THRESHOLD
            return (
              <span
                key={item.type}
                className={`algorithm-flow__badge${
                  isLowConfidence ? ' algorithm-flow__badge--low-confidence' : ''
                }`}
                title={isLowConfidence ? 'Possible pattern (low confidence)' : undefined}
              >
                {formatLabel(item.type)} {formatPercent(item.confidence)}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
