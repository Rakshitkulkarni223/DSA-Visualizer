import type { ExampleItem, VisualizeRequest, VisualizeResponse } from '../types/schema'

// Base URL from VITE_API_URL, defaulting to the local backend dev server.
const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

/**
 * POST /api/visualize
 * The backend always responds HTTP 200 with a `status` field distinguishing
 * success from error cases (syntax_error/runtime_error/timeout/step_limit_exceeded)
 * per CONTRACT.md, so the frontend has exactly one code path to parse the body.
 */
export async function visualize(request: VisualizeRequest): Promise<VisualizeResponse> {
  const res = await fetch(`${BASE_URL}/api/visualize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    // Transport-level failure (network/server down/5xx) - not a modeled
    // CONTRACT.md status, so surface it as a runtime_error-shaped object so
    // the rest of the app can render it through the same Error UI.
    throw new Error(`Request to /api/visualize failed with HTTP ${res.status}`)
  }

  return (await res.json()) as VisualizeResponse
}

/** GET /api/examples */
export async function getExamples(): Promise<ExampleItem[]> {
  const res = await fetch(`${BASE_URL}/api/examples`)

  if (!res.ok) {
    throw new Error(`Request to /api/examples failed with HTTP ${res.status}`)
  }

  return (await res.json()) as ExampleItem[]
}
