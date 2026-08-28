// Small hook-friendly playback store. Deliberately not Redux/Zustand - this
// is just a `useState` + `useEffect` interval, wrapped in a hook so
// Controls/Timeline/CodeEditor can all subscribe to the same cursor.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { StepSnapshot } from '../types/schema'
import { clampIndex } from './timeline'

export type PlaybackSpeed = 0.5 | 1 | 2 | 4

// Base time between auto-advance ticks at 1x speed. Not specified by
// CONTRACT.md (playback is a frontend-only concern) - 900ms was chosen as a
// readable-but-not-sluggish default; actual tick = BASE_TICK_MS / speed.
const BASE_TICK_MS = 900

export interface PlaybackControls {
  currentIndex: number
  currentStep: StepSnapshot | null
  total: number
  isPlaying: boolean
  speed: PlaybackSpeed
  isAtStart: boolean
  isAtEnd: boolean
  play(): void
  pause(): void
  toggle(): void
  next(): void
  prev(): void
  restart(): void
  goTo(index: number): void
  setSpeed(speed: PlaybackSpeed): void
}

export function usePlayback(steps: StepSnapshot[]): PlaybackControls {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1)

  const total = steps.length

  // Reset the cursor whenever a new run's step list arrives.
  useEffect(() => {
    setCurrentIndex(0)
    setIsPlaying(false)
  }, [steps])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isPlaying || total === 0) return

    const tickMs = BASE_TICK_MS / speed
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1
        if (nextIndex >= total) {
          // Auto-pause at the last step.
          setIsPlaying(false)
          return total - 1
        }
        return nextIndex
      })
    }, tickMs)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, speed, total])

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(clampIndex(index, total))
    },
    [total],
  )

  const next = useCallback(() => {
    setCurrentIndex((prev) => clampIndex(prev + 1, total))
  }, [total])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => clampIndex(prev - 1, total))
  }, [total])

  const restart = useCallback(() => {
    setCurrentIndex(0)
    setIsPlaying(false)
  }, [])

  const play = useCallback(() => {
    if (total === 0) return
    setIsPlaying(true)
  }, [total])

  const pause = useCallback(() => setIsPlaying(false), [])

  const toggle = useCallback(() => {
    setIsPlaying((prev) => (total === 0 ? false : !prev))
  }, [total])

  return {
    currentIndex,
    currentStep: total > 0 ? steps[currentIndex] : null,
    total,
    isPlaying,
    speed,
    isAtStart: currentIndex <= 0,
    isAtEnd: currentIndex >= total - 1,
    play,
    pause,
    toggle,
    next,
    prev,
    restart,
    goTo,
    setSpeed: setSpeedState,
  }
}
