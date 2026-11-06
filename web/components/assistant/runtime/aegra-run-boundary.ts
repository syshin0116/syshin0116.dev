import type { FetchLike } from "./token-broker"

const AEGRA_RUN_EVENT_ID = /^(.+?)(?::[a-z-]+|_event_\d+):\d+$/

function nameRootLifecycleRun(line: string): string {
  if (!line.startsWith("data:") || !line.includes('"lifecycle"')) return line
  let event: {
    event_id?: unknown
    method?: unknown
    params?: { namespace?: unknown }
  }
  try {
    event = JSON.parse(line.slice("data:".length))
  } catch {
    return line
  }
  const namespace = event.params?.namespace
  if (
    event.method !== "lifecycle" ||
    !Array.isArray(namespace) ||
    namespace.length > 0 ||
    typeof event.event_id !== "string" ||
    event.event_id.startsWith("synth:")
  ) {
    return line
  }
  const runId = AEGRA_RUN_EVENT_ID.exec(event.event_id)?.[1]
  if (!runId) return line
  return `data: ${JSON.stringify({ ...event, event_id: `synth:${runId}:${event.event_id}` })}`
}

function nameRootLifecycleRuns(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let partialLine = ""
  return body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const lines = (partialLine + decoder.decode(chunk, { stream: true })).split("\n")
      partialLine = lines.pop() ?? ""
      if (lines.length > 0) {
        controller.enqueue(encoder.encode(`${lines.map(nameRootLifecycleRun).join("\n")}\n`))
      }
    },
    flush(controller) {
      const rest = partialLine + decoder.decode()
      if (rest) controller.enqueue(encoder.encode(nameRootLifecycleRun(rest)))
    },
  }))
}

/**
 * Aegra answers every command with `applied_through_seq: 0`, so the SDK places
 * its interrupt replay cutoff at the new run's root `running` event and ignores
 * root terminals from other runs. It reads the run from `synth:<run_id>:...`
 * only, while Aegra sends `<run_id>:running:<n>` and `<run_id>_event_<n>:<i>`.
 * Without that name, new interrupts stay buffered and are never shown.
 */
export function withAegraRunBoundaries(fetchImpl: FetchLike): FetchLike {
  return async (input, init) => {
    const response = await fetchImpl(input, init)
    const url = input instanceof Request ? input.url : String(input)
    if (
      !response.ok ||
      !response.body ||
      !new URL(url).pathname.endsWith("/stream/events")
    ) {
      return response
    }
    return new Response(nameRootLifecycleRuns(response.body), response)
  }
}
