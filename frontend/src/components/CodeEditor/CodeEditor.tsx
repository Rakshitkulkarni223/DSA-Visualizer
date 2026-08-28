import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type * as MonacoEditor from 'monaco-editor'

export interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  /** The current step's `line` (1-indexed), or null when no run is loaded. */
  currentLine: number | null
  /** Read-only while a run is loaded; toggled back to editable on Reset. */
  readOnly: boolean
}

/**
 * Monaco-based Python code editor. Re-applies a line-highlight decoration
 * every time `currentLine` changes, without needing to remount the editor.
 */
export function CodeEditor({ code, onChange, currentLine, readOnly }: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<MonacoEditor.editor.IEditorDecorationsCollection | null>(null)

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    decorationsRef.current = editor.createDecorationsCollection([])
  }

  useEffect(() => {
    const decorations = decorationsRef.current
    const editor = editorRef.current
    if (!decorations || !editor) return

    if (currentLine === null) {
      decorations.set([])
      return
    }

    decorations.set([
      {
        range: {
          startLineNumber: currentLine,
          startColumn: 1,
          endLineNumber: currentLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'current-line-highlight',
          linesDecorationsClassName: 'current-line-gutter',
        },
      },
    ])
    // Only scroll when the line is actually out of view. Using
    // revealLineInCenter unconditionally here snaps the viewport on every
    // single step -- fine for a straight-line loop, but for recursion/DP
    // traces where the current line oscillates between a low line (e.g. the
    // memo check) and a high line (the recursive call) almost every step,
    // that made the editor visibly jump/scroll on every playback tick.
    editor.revealLineInCenterIfOutsideViewport(currentLine)
  }, [currentLine])

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        value={code}
        onChange={(value) => onChange(value ?? '')}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
