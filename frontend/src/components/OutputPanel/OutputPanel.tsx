import type { JsonValue } from '../../types/schema'

export interface OutputPanelProps {
  output: JsonValue | null
  expectedOutput: JsonValue | null
  outputMatches: boolean | null
}

function formatOutput(value: JsonValue | null): string {
  if (value === null) return 'null'
  return JSON.stringify(value, null, 2)
}

/**
 * Shows Expected vs Actual (with a match indicator) when an expectedOutput
 * was provided; otherwise just shows Actual.
 */
export function OutputPanel({ output, expectedOutput, outputMatches }: OutputPanelProps) {
  const hasExpected = expectedOutput !== null && expectedOutput !== undefined

  return (
    <div className="output-panel">
      <div className="output-panel__row">
        <span className="output-panel__label">Actual</span>
        <pre className="output-panel__value">{formatOutput(output)}</pre>
      </div>

      {hasExpected && (
        <>
          <div className="output-panel__row">
            <span className="output-panel__label">Expected</span>
            <pre className="output-panel__value">{formatOutput(expectedOutput)}</pre>
          </div>
          <div
            className={`output-panel__match output-panel__match--${
              outputMatches ? 'pass' : 'fail'
            }`}
          >
            {outputMatches ? '✓ Output matches expected' : '✗ Output does not match expected'}
          </div>
        </>
      )}
    </div>
  )
}
