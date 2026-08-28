export interface TimelineProps {
  currentIndex: number
  total: number
  onScrub: (index: number) => void
}

/** Draggable scrubber bound to the current step index / total steps. */
export function Timeline({ currentIndex, total, onScrub }: TimelineProps) {
  const max = Math.max(0, total - 1)

  return (
    <div className="timeline">
      <input
        type="range"
        className="timeline__range"
        min={0}
        max={max}
        value={Math.min(currentIndex, max)}
        disabled={total === 0}
        onChange={(event) => onScrub(Number(event.target.value))}
      />
      <span className="timeline__label">
        Step {total === 0 ? 0 : currentIndex + 1} / {total}
      </span>
    </div>
  )
}
