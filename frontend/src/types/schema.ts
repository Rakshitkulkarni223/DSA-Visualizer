// Single source of truth for all types mirroring docs/CONTRACT.md.
// Every component/module should import shapes from here rather than
// redefining them locally.

/** Any JSON-safe value, per CONTRACT.md's "Every value ... must be JSON-safe" rule. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

/** A key/value bag of JSON-safe values (variables, locals, structure values map, etc). */
export type JsonObject = { [key: string]: JsonValue }

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Phase 1 vocabulary (CONTRACT.md "Detection output types"):
 * Structure types: array, string, generic
 * Algorithm/pattern types: two_pointer, sliding_window, binary_search, recursion, iteration
 * Left as `string` (not a union) so the frontend never hard-fails on a type it
 * doesn't recognize yet - it just renders the badge/falls back gracefully.
 */
export interface Detection {
  type: string
  confidence: number
}

// ---------------------------------------------------------------------------
// Complexity
// ---------------------------------------------------------------------------

export interface Complexity {
  time: string
  space: string
  explanation: string
  estimated: boolean
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export interface StructureHighlights {
  current: number[]
  visited: number[]
  active: number[]
}

/** Known Phase 1 structure type literals, widened to `string` for forward compat. */
export type StructureType = 'array' | 'string' | 'generic' | string

export interface Structure {
  id: string
  type: StructureType
  values: JsonValue[]
  pointers: Record<string, number>
  highlights: StructureHighlights
  window: [number, number] | null
}

// ---------------------------------------------------------------------------
// Call stack
// ---------------------------------------------------------------------------

export interface CallFrame {
  function: string
  line: number
  locals: JsonObject
}

// ---------------------------------------------------------------------------
// Operation
// ---------------------------------------------------------------------------

export interface Operation {
  type: string
  description: string
}

// ---------------------------------------------------------------------------
// StepSnapshot - the ONLY shape the frontend consumes for a single step.
// ---------------------------------------------------------------------------

export type StepEvent = 'line' | 'call' | 'return' | 'exception'

export interface StepSnapshot {
  step: number
  line: number
  event: StepEvent
  functionName: string
  variables: JsonObject
  callStack: CallFrame[]
  structures: Structure[]
  operation: Operation | null
  explanation: string | null
  returnValue: JsonValue | null
}

// ---------------------------------------------------------------------------
// /api/visualize
// ---------------------------------------------------------------------------

export interface VisualizeRequest {
  language: 'python'
  code: string
  input: JsonObject
  expectedOutput?: JsonValue
}

export interface VisualizeSuccessResponse {
  status: 'success'
  output: JsonValue
  expectedOutput: JsonValue | null
  outputMatches: boolean | null
  detected: Detection[]
  complexity: Complexity
  steps: StepSnapshot[]
  truncated: boolean
  maxSteps: number
}

export type ErrorStatus =
  | 'syntax_error'
  | 'runtime_error'
  | 'timeout'
  | 'step_limit_exceeded'

export interface VisualizeErrorResponse {
  status: ErrorStatus
  message: string
  line: number | null
  detail: string
}

export type VisualizeResponse = VisualizeSuccessResponse | VisualizeErrorResponse

export function isSuccessResponse(
  response: VisualizeResponse,
): response is VisualizeSuccessResponse {
  return response.status === 'success'
}

// ---------------------------------------------------------------------------
// /api/examples
// ---------------------------------------------------------------------------

export interface ExampleItem {
  id: string
  title: string
  category: string
  code: string
  input: JsonObject
  expectedOutput?: JsonValue
}
