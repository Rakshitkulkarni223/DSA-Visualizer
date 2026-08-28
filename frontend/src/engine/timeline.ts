// Pure timeline navigation logic - no React here on purpose.
//
// All steps are already fetched and held in memory (StepSnapshot[] from the
// /api/visualize response), so "going backward" is trivially exact: it is
// just indexing into the array again, never re-running/mutating anything.

import type { StepSnapshot } from '../types/schema'

export interface Timeline {
  readonly steps: StepSnapshot[]
  readonly length: number
  goTo(index: number): number
  next(): number
  prev(): number
  restart(): number
  clamp(index: number): number
}

/**
 * Creates a Timeline bound to a fixed list of steps and a mutable "current
 * index" cursor. Every method returns the resulting clamped index so callers
 * (e.g. the usePlayback hook) can sync it straight into state.
 */
export function createTimeline(steps: StepSnapshot[], startIndex = 0): Timeline {
  let currentIndex = clampIndex(startIndex, steps.length)

  return {
    steps,
    length: steps.length,
    clamp(index: number) {
      return clampIndex(index, steps.length)
    },
    goTo(index: number) {
      currentIndex = clampIndex(index, steps.length)
      return currentIndex
    },
    next() {
      currentIndex = clampIndex(currentIndex + 1, steps.length)
      return currentIndex
    },
    prev() {
      currentIndex = clampIndex(currentIndex - 1, steps.length)
      return currentIndex
    },
    restart() {
      currentIndex = 0
      return currentIndex
    },
  }
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  if (index < 0) return 0
  if (index > length - 1) return length - 1
  return index
}
