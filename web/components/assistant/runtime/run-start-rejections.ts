import type { FetchLike } from "./token-broker"

export function trackRunStartRejections(fetchImpl: FetchLike) {
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
        const error = Object.assign(new Error(`Run request rejected: HTTP ${response.status}`), { status: response.status })
        rejectedRequests.add(error)
        void response.body?.cancel().catch(() => {})
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
