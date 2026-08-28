// Shared rendering/animation logic for ArrayVisualizer and StringVisualizer -
// both are "indexed cells with pointers + highlights + an optional window",
// they only differ in how a cell's value is displayed. Kept internal to
// src/visualizers (not part of the public dispatcher surface).

import { motion } from 'framer-motion'
import type { JsonValue, Structure } from '../../types/schema'
import { cellHighlightVariants, pointerMoveTransition } from '../../engine/animation'

const CELL_SIZE = 44
const CELL_GAP = 6
const POINTER_ROW_HEIGHT = 28

function formatCellValue(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function highlightKind(
  index: number,
  highlights: Structure['highlights'],
): 'current' | 'active' | 'visited' | null {
  if (highlights.current?.includes(index)) return 'current'
  if (highlights.active?.includes(index)) return 'active'
  if (highlights.visited?.includes(index)) return 'visited'
  return null
}

export interface CellRowProps {
  structure: Structure
  /** Groups pointers that share an index so their arrows don't overlap. */
  variant: 'array' | 'string'
}

export function CellRow({ structure, variant }: CellRowProps) {
  const { values, pointers, highlights, window: windowRange } = structure
  const pointerEntries = Object.entries(pointers ?? {})

  // Group pointer names by the index they currently point at, so multiple
  // pointers on the same cell stack vertically instead of overlapping.
  const pointersByIndex = new Map<number, string[]>()
  for (const [name, index] of pointerEntries) {
    const list = pointersByIndex.get(index) ?? []
    list.push(name)
    pointersByIndex.set(index, list)
  }
  const maxStackedPointers = Math.max(1, ...Array.from(pointersByIndex.values(), (v) => v.length))
  const pointerAreaHeight = maxStackedPointers * POINTER_ROW_HEIGHT

  const rowWidth = values.length * CELL_SIZE + Math.max(0, values.length - 1) * CELL_GAP

  return (
    <div className={`cell-row cell-row--${variant}`} style={{ width: rowWidth }}>
      {/* Pointer arrows - keyed by pointer name so Framer Motion animates
          position across steps instead of unmounting/remounting. */}
      <div className="cell-row__pointers" style={{ height: pointerAreaHeight }}>
        {pointerEntries.map(([name, index]) => {
          const stack = pointersByIndex.get(index) ?? [name]
          const stackPos = stack.indexOf(name)
          const x = index * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2
          return (
            <motion.div
              key={name}
              className="cell-row__pointer"
              initial={false}
              animate={{ x, top: stackPos * POINTER_ROW_HEIGHT }}
              transition={pointerMoveTransition}
              style={{ position: 'absolute' }}
            >
              <div className="cell-row__pointer-arrow">▼</div>
              <div className="cell-row__pointer-label">{name}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Cells - keyed by index (stable for a given logical structure id),
          content/highlight updates in place, container never remounts. */}
      <div className="cell-row__cells">
        {values.map((value, index) => {
          const kind = highlightKind(index, highlights)
          return (
            <motion.div
              key={index}
              className={`cell-row__cell${kind ? ` cell-row__cell--${kind}` : ''}`}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              variants={cellHighlightVariants}
              animate={kind === 'current' ? 'pulse' : 'idle'}
            >
              <span className="cell-row__value">{formatCellValue(value)}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Index labels below each cell. */}
      <div className="cell-row__indices">
        {values.map((_, index) => (
          <div key={index} className="cell-row__index" style={{ width: CELL_SIZE }}>
            {index}
          </div>
        ))}
      </div>

      {/* Window bracket, spanning [start, end] inclusive. */}
      {windowRange && (
        <motion.div
          className="cell-row__window"
          initial={false}
          animate={{
            left: windowRange[0] * (CELL_SIZE + CELL_GAP),
            width:
              (windowRange[1] - windowRange[0] + 1) * CELL_SIZE +
              (windowRange[1] - windowRange[0]) * CELL_GAP,
          }}
          transition={pointerMoveTransition}
        >
          <span className="cell-row__window-label">WINDOW</span>
        </motion.div>
      )}
    </div>
  )
}
