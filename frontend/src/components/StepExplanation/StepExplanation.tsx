import type { StepSnapshot } from '../../types/schema'

export interface StepExplanationProps {
  step: StepSnapshot | null
}

/** Builds a generic sentence from line/event/functionName when `explanation` is null. */
function fallbackExplanation(step: StepSnapshot): string {
  switch (step.event) {
    case 'call':
      return `Line ${step.line}: entered function "${step.functionName}".`
    case 'return':
      return `Line ${step.line}: returning from "${step.functionName}"${
        step.returnValue !== null ? ` with value ${JSON.stringify(step.returnValue)}` : ''
      }.`
    case 'exception':
      return `Line ${step.line}: an exception occurred in "${step.functionName}".`
    default:
      return `Line ${step.line}: executing inside "${step.functionName}".`
  }
}

/** Renders `currentStep.explanation` + `operation` as "what's happening on this step". */
export function StepExplanation({ step }: StepExplanationProps) {
  if (!step) {
    return (
      <div className="panel step-explanation">
        <h3 className="panel__heading">What's happening</h3>
        <p className="panel__empty-note">No run loaded yet.</p>
      </div>
    )
  }

  const text = step.explanation ?? fallbackExplanation(step)

  return (
    <div className="panel step-explanation">
      <h3 className="panel__heading">What's happening</h3>
      <p className="step-explanation__text">{text}</p>
      {step.operation && (
        <p className="step-explanation__operation">
          <span className="step-explanation__operation-type">{step.operation.type}</span>
          {' — '}
          {step.operation.description}
        </p>
      )}
    </div>
  )
}
