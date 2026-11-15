import { AGENT_REJECTION_CODES, parseRetryAfter, type AgentRejectionCode } from "./error-state"
import type { FetchLike } from "./token-broker"

const MAX_REJECTION_BODY_CHARS = 4_096

/** Reads only an allowlisted `error` code; the rest of the body is dropped. */
async function rejectionCode(response: Response): Promise<AgentRejectionCode | undefined> {
  try {
    const text = await response.text()
    if (text.length > MAX_REJECTION_BODY_CHARS) return undefined
    const body: unknown = JSON.parse(text)
    if (typeof body !== "object" || body === null || !("error" in body)) return undefined
    return (AGENT_REJECTION_CODES as readonly unknown[]).includes(body.error)
      ? (body.error as AgentRejectionCode)
      : undefined
  } catch {
    return undefined
  }
}

export function trackRunStartRejections(fetchImpl: FetchLike, now: () => number = Date.now) {
  const rejectedRequests = new WeakSet<Error>()

  return {
    async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const request = new Request(input instanceof Request ? input.clone() : input, init)
      let startsRun = false
      if (request.method === "POST" && new URL(request.url).pathname.endsWith("/commands")) {
        try {
          const command: unknown = await request.clone().json()
          startsRun = typeof command === "object" && command !== null &&
            "method" in command && command.method === "run.start"
        } catch {
          // Leave malformed requests to the SDK/server's existing error handling.
        }
      }
      const response = await fetchImpl(input, init)
      if (startsRun && !response.ok) {
        // Cross-origin, Retry-After is readable only when the agent exposes it.
        const retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"), now())
        const code = await rejectionCode(response)
        const error = Object.assign(new Error(`Run request rejected: HTTP ${response.status}`), {
          status: response.status,
          ...(code ? { code } : {}),
          ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
        })
        rejectedRequests.add(error)
        throw error
      }
      return response
    },
    wasRejected(error: unknown): boolean {
      // A stream failure or lost response does not prove that run.start was rejected.
      return error instanceof Error && rejectedRequests.has(error)
    },
  }
}
