import { useEffect, useState } from 'react'
import { getExamples } from '../api/client'
import type { ExampleItem } from '../types/schema'

export interface ExamplePickerProps {
  onSelect: (example: ExampleItem) => void
}

/** Dropdown populated from GET /api/examples; selecting one fills code/input. */
export function ExamplePicker({ onSelect }: ExamplePickerProps) {
  const [examples, setExamples] = useState<ExampleItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    getExamples()
      .then((items) => {
        if (!cancelled) setExamples(items)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load examples')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(id: string) {
    setSelectedId(id)
    const example = examples.find((item) => item.id === id)
    if (example) onSelect(example)
  }

  return (
    <div className="example-picker">
      <label className="example-picker__label">
        Example
        <select
          value={selectedId}
          onChange={(event) => handleChange(event.target.value)}
          disabled={examples.length === 0}
        >
          <option value="" disabled>
            {error ? 'Failed to load examples' : examples.length === 0 ? 'Loading…' : 'Choose an example…'}
          </option>
          {examples.map((example) => (
            <option key={example.id} value={example.id}>
              {example.title} ({example.category})
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
