// Minimal Framer Motion presets shared by ArrayVisualizer/StringVisualizer.
// Clarity over flashiness, per the spec's design principles - just enough
// motion to make pointer moves and highlight changes legible.

import type { Transition, Variants } from 'framer-motion'

/** Applied to a pointer arrow's `animate` x/left position when it moves between steps. */
export const pointerMoveTransition: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.6,
}

/** A brief pulse for a cell that just became "current"/"active". */
export const cellHighlightVariants: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.12, 1],
    transition: { duration: 0.32, ease: 'easeOut' },
  },
}

/** Fade/slide used for small text panels that swap content on step change (e.g. explanation). */
export const stepTextVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
}

/** Border/background color transition for cell highlight state changes. */
export const cellColorTransition: Transition = {
  duration: 0.22,
  ease: 'easeOut',
}
