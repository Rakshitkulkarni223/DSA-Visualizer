import type { PlaybackControls, PlaybackSpeed } from '../../engine/stateManager'

export interface ControlsProps {
  playback: PlaybackControls
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2, 4]

/** Previous / Play-Pause / Next / Restart buttons + speed selector. */
export function Controls({ playback }: ControlsProps) {
  const disabled = playback.total === 0

  return (
    <div className="controls">
      <button type="button" onClick={playback.restart} disabled={disabled} title="Restart">
        ⏮ Restart
      </button>
      <button
        type="button"
        onClick={playback.prev}
        disabled={disabled || playback.isAtStart}
        title="Previous step"
      >
        ◀ Prev
      </button>
      <button
        type="button"
        className="controls__play-pause"
        onClick={playback.toggle}
        disabled={disabled}
        title={playback.isPlaying ? 'Pause' : 'Play'}
      >
        {playback.isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      <button
        type="button"
        onClick={playback.next}
        disabled={disabled || playback.isAtEnd}
        title="Next step"
      >
        Next ▶
      </button>
      <label className="controls__speed">
        Speed
        <select
          value={playback.speed}
          disabled={disabled}
          onChange={(event) => playback.setSpeed(Number(event.target.value) as PlaybackSpeed)}
        >
          {SPEED_OPTIONS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
