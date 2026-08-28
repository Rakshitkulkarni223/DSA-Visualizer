import { useEffect, useState } from 'react'
import type { JsonObject } from '../../types/schema'

export interface InputEditorProps {
  /** Parsed JSON object bound from the parent (e.g. filled by ExamplePicker). */
  value: JsonObject
  onChange: (value: JsonObject) => void
  readOnly: boolean
}

/**
 * JSON textarea bound to the input object, with inline JSON.parse
 * validation. Only calls `onChange` with a parsed object once the text is
 * valid JSON *and* an object (matching CONTRACT.md's request `input` shape).
 */
export function InputEditor({ value, onChange, readOnly }: InputEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)

  // Keep the textarea in sync when the parent swaps `value` wholesale
  // (e.g. selecting a different example).
  useEffect(() => {
    setText(JSON.stringify(value, null, 2))
    setError(null)
  }, [value])

  function handleChange(next: string) {
    setText(next)
    try {
      const parsed = JSON.parse(next)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('Input must be a JSON object, e.g. { "nums": [2, 7, 11, 15] }')
        return
      }
      setError(null)
      onChange(parsed as JsonObject)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  return (
    <div className="input-editor">
      <textarea
        className={`input-editor__textarea${error ? ' input-editor__textarea--error' : ''}`}
        value={text}
        readOnly={readOnly}
        spellCheck={false}
        onChange={(event) => handleChange(event.target.value)}
      />
      {error && <p className="input-editor__error">{error}</p>}
    </div>
  )
}
