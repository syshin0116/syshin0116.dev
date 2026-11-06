import { expect, test } from "bun:test"
import { withAegraRunBoundaries } from "./aegra-run-boundary"

const STREAM_URL = "https://agent.example/threads/one/stream/events"

function frame(eventId: string, namespace: string[], event = "running", method = "lifecycle") {
  return `id: 1\nevent: ${method}\ndata: ${JSON.stringify({
    type: "event",
    event_id: eventId,
    seq: 1,
    method,
    params: { namespace, timestamp: 1, data: { event } },
  })}\n\n`
}

function chunkedBody(text: string, size: number) {
  const bytes = new TextEncoder().encode(text)
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += size) {
        controller.enqueue(bytes.slice(offset, offset + size))
      }
      controller.close()
    },
  })
}

async function adapt(body: BodyInit | null, url = STREAM_URL, status = 200) {
  const fetch = withAegraRunBoundaries(async () => new Response(body, { status }))
  return (await fetch(url, { method: "POST" })).text()
}

test.each([
  ["run-1:running:0", "running"],
  ["run-1_event_12:0", "completed"],
  ["run-1:status-end:0", "failed"],
])("names the run on root lifecycle %s split across byte chunks", async (eventId, event) => {
  const text = await adapt(chunkedBody(frame(eventId, [], event), 7))
  expect(text).toContain(`"event_id":"synth:run-1:${eventId}"`)
  expect(text).toContain('"seq":1')
  expect(text.endsWith("\n\n")).toBe(true)
})

test("keeps multibyte text intact across chunk boundaries", async () => {
  const value = frame("run-1_event_3:0", [], "검색 진행 중", "custom")
  expect(await adapt(chunkedBody(value, 3))).toBe(value)
})

test.each([
  ["nested running", frame("run-1:running:0", ["task:1"])],
  ["run-less lifecycle", frame("browser-event-4", [])],
  ["already synthesized", frame("synth:run-1:running:0", [])],
  ["other method", frame("run-1:running:0", [], "running", "custom")],
  ["heartbeat", ": heartbeat\n\n"],
  ["malformed data", "data: {:running:\n\n"],
])("leaves %s unchanged", async (_, value) => {
  expect(await adapt(value)).toBe(value)
})

test("only adapts successful event streams", async () => {
  const value = frame("run-1:running:0", [])
  expect(await adapt(value, "https://agent.example/threads/one/commands")).toBe(value)
  expect(await adapt(value, STREAM_URL, 503)).toBe(value)
})

test("preserves response metadata and propagates cancellation", async () => {
  let cancelled = false
  const body = new ReadableStream<Uint8Array>({ cancel() { cancelled = true } })
  const fetch = withAegraRunBoundaries(async () => new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  }))
  const response = await fetch(new Request(STREAM_URL, { method: "POST" }))
  expect(response.headers.get("content-type")).toBe("text/event-stream")
  await response.body?.cancel()
  await Bun.sleep(0)
  expect(cancelled).toBe(true)
})
