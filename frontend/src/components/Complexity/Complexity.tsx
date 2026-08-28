import type { Complexity as ComplexityType } from '../../types/schema'

export interface ComplexityProps {
  complexity: ComplexityType | null
}

/**
 * Renders time/space complexity + explanation, visibly labeled "Estimated"
 * per CONTRACT.md's `estimated` flag - never presented as certain fact.
 */
export function Complexity({ complexity }: ComplexityProps) {
  if (!complexity) {
    return (
      <div className="panel complexity">
        <h3 className="panel__heading">Complexity</h3>
        <p className="panel__empty-note">No run loaded yet.</p>
      </div>
    )
  }

  return (
    <div className="panel complexity">
      <h3 className="panel__heading">
        Complexity
        {complexity.estimated && <span className="complexity__estimated-badge">Estimated</span>}
      </h3>
      <div className="complexity__grid">
        <div className="complexity__cell">
          <span className="complexity__cell-label">Time</span>
          <span className="complexity__cell-value">{complexity.time}</span>
        </div>
        <div className="complexity__cell">
          <span className="complexity__cell-label">Space</span>
          <span className="complexity__cell-value">{complexity.space}</span>
        </div>
      </div>
      <p className="complexity__explanation">{complexity.explanation}</p>
    </div>
  )
}
