import { useEffect, useMemo, useState } from 'react'
import { visualize } from './api/client'
import { usePlayback } from './engine/stateManager'
import { isSuccessResponse } from './types/schema'
import type { ExampleItem, JsonObject, JsonValue, VisualizeResponse } from './types/schema'
import { CodeEditor } from './components/CodeEditor/CodeEditor'
import { InputEditor } from './components/InputEditor/InputEditor'
import { OutputPanel } from './components/OutputPanel/OutputPanel'
import { VariablesPanel } from './components/VariablesPanel/VariablesPanel'
import { CallStack } from './components/CallStack/CallStack'
import { Timeline } from './components/Timeline/Timeline'
import { Controls } from './components/Controls/Controls'
import { AlgorithmFlow } from './components/AlgorithmFlow/AlgorithmFlow'
import { StepExplanation } from './components/StepExplanation/StepExplanation'
import { Complexity } from './components/Complexity/Complexity'
import { ExamplePicker } from './examples/ExamplePicker'
import { VisualizerDispatcher } from './visualizers/VisualizerDispatcher'
import {
  twoSumFixtureCode,
  twoSumFixtureExpectedOutput,
  twoSumFixtureInput,
  twoSumFixtureResponse,
} from './examples/fixtures/twoSumFixture'

const DEFAULT_CODE = `def two_sum(nums, target):
    left = 0
    right = len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        elif total < target:
            left += 1
        else:
            right -= 1
    return []
`

const DEFAULT_INPUT: JsonObject = { nums: [2, 7, 11, 15], target: 9 }

// Dev escape hatch: `?fixture=1` loads a hardcoded VisualizeResponse instead
// of calling the real API, so the app can be verified end-to-end without a
// running backend. The real API path remains the default.
const USE_FIXTURE = new URLSearchParams(window.location.search).get('fixture') === '1'

function App() {
  const [code, setCode] = useState(USE_FIXTURE ? twoSumFixtureCode : DEFAULT_CODE)
  const [input, setInput] = useState<JsonObject>(USE_FIXTURE ? twoSumFixtureInput : DEFAULT_INPUT)
  const [expectedOutput, setExpectedOutput] = useState<JsonValue | undefined>(
    USE_FIXTURE ? twoSumFixtureExpectedOutput : undefined,
  )
  const [response, setResponse] = useState<VisualizeResponse | null>(
    USE_FIXTURE ? twoSumFixtureResponse : null,
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (USE_FIXTURE) {
      // eslint-disable-next-line no-console
      console.info('[DSA Visualizer] Rendering against src/examples/fixtures/twoSumFixture.ts (?fixture=1) - not calling the real API.')
    }
  }, [])

  const steps = useMemo(
    () => (response && isSuccessResponse(response) ? response.steps : []),
    [response],
  )
  const playback = usePlayback(steps)
  const currentStep = playback.currentStep

  const hasLoadedRun = response !== null
  const isCodeReadOnly = hasLoadedRun

  async function handleRun() {
    setIsLoading(true)
    try {
      const result = await visualize({ language: 'python', code, input, expectedOutput })
      setResponse(result)
    } catch (err) {
      // Transport-level failure (network down, backend not running, 5xx) -
      // not a modeled CONTRACT.md status, so surface it through the same
      // Error UI as a runtime_error-shaped object rather than crashing.
      setResponse({
        status: 'runtime_error',
        message: 'Could not reach the visualizer backend.',
        line: null,
        detail: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setResponse(null)
  }

  function handleSelectExample(example: ExampleItem) {
    setCode(example.code)
    setInput(example.input)
    setExpectedOutput(example.expectedOutput)
    setResponse(null)
  }

  const isError = response !== null && response.status !== 'success'

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">DSA Visualizer</h1>
        <ExamplePicker onSelect={handleSelectExample} />
        <div className="app-header__actions">
          <button type="button" onClick={handleRun} disabled={isLoading}>
            {isLoading ? 'Running…' : 'Run'}
          </button>
          <button type="button" onClick={handleReset} disabled={!hasLoadedRun}>
            Reset
          </button>
          <button type="button" disabled title="Settings — coming soon">
            Settings
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="app-panel app-panel--code">
          <h2 className="app-panel__heading">Code</h2>
          <CodeEditor
            code={code}
            onChange={setCode}
            currentLine={currentStep?.line ?? null}
            readOnly={isCodeReadOnly}
          />
        </section>

        <section className="app-panel app-panel--visual">
          <h2 className="app-panel__heading">Visualization</h2>
          {response && isSuccessResponse(response) && (
            <AlgorithmFlow detected={response.detected} />
          )}
          <div className="app-panel__scroll">
            <VisualizerDispatcher step={currentStep} />
          </div>
        </section>

        <section className="app-panel app-panel--input">
          <h2 className="app-panel__heading">Input</h2>
          <InputEditor value={input} onChange={setInput} readOnly={isCodeReadOnly} />
        </section>

        <section className="app-panel app-panel--output">
          <h2 className="app-panel__heading">Output</h2>
          {isError ? (
            <ErrorPanel response={response} />
          ) : (
            <OutputPanel
              output={response && isSuccessResponse(response) ? response.output : null}
              expectedOutput={response && isSuccessResponse(response) ? response.expectedOutput : null}
              outputMatches={response && isSuccessResponse(response) ? response.outputMatches : null}
            />
          )}
        </section>
      </main>

      <section className="app-middle-band">
        <VariablesPanel step={currentStep} />
        <CallStack step={currentStep} />
        <StepExplanation step={currentStep} />
        <Complexity complexity={response && isSuccessResponse(response) ? response.complexity : null} />
      </section>

      <footer className="app-footer">
        <Timeline currentIndex={playback.currentIndex} total={playback.total} onScrub={playback.goTo} />
        <Controls playback={playback} />
      </footer>
    </div>
  )
}

function ErrorPanel({ response }: { response: VisualizeResponse }) {
  if (response.status === 'success') return null
  return (
    <div className={`error-panel error-panel--${response.status}`}>
      <span className="error-panel__status">{response.status.replace(/_/g, ' ')}</span>
      <p className="error-panel__message">{response.message}</p>
      {response.line !== null && <p className="error-panel__line">Line: {response.line}</p>}
      {response.detail && <pre className="error-panel__detail">{response.detail}</pre>}
    </div>
  )
}

export default App
