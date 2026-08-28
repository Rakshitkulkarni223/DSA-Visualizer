import type { ComponentType } from 'react'
import type { StepSnapshot, Structure } from '../types/schema'
import { ArrayVisualizer } from './ArrayVisualizer'
import { StringVisualizer } from './StringVisualizer'
import { GenericVisualizer } from './GenericVisualizer'

interface StructureVisualizerProps {
  structure: Structure
}

// Phase 1 active registry: array/string only. Registering a new structure
// type later (Phase 2: stack, queue, linked_list, tree, graph, heap, trie,
// dp, matrix, ...) is a one-line addition here - no dispatcher rewrite
// needed. Unregistered types fall back to GenericVisualizer.
const VISUALIZER_REGISTRY: Record<string, ComponentType<StructureVisualizerProps>> = {
  array: ArrayVisualizer,
  string: StringVisualizer,
}

export interface VisualizerDispatcherProps {
  step: StepSnapshot | null
}

/**
 * Given the current StepSnapshot, renders one visualizer per detected
 * structure by `type`, falling back to GenericVisualizer for unknown types
 * or when there are no structures at all.
 */
export function VisualizerDispatcher({ step }: VisualizerDispatcherProps) {
  if (!step || step.structures.length === 0) {
    return (
      <div className="visualizer-dispatcher">
        <GenericVisualizer step={step} />
      </div>
    )
  }

  return (
    <div className="visualizer-dispatcher">
      {step.structures.map((structure) => {
        const Visualizer = VISUALIZER_REGISTRY[structure.type]
        if (Visualizer) {
          // Key by structure.id (stable across the whole run) so React
          // never unmounts/remounts it between steps - only its props
          // (highlights/pointers/window/values) change.
          return <Visualizer key={structure.id} structure={structure} />
        }
        return <GenericVisualizer key={structure.id} step={step} structure={structure} />
      })}
    </div>
  )
}
