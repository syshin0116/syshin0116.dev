import { expect, test } from "bun:test"
import { trackRunStartRejections } from "./run-start-rejections"

test.each(["run.start", "state.get", "input.respond"])("only identifies rejected run.start commands: %s", async (method) => {
  const response = new Response("unavailable", { status: 503 })
  const tracker = trackRunStartRejections(async (input, init) => {
    expect(await new Request(input, init).json()).toEqual({ method })
    return response
  })
  const request = new Request("https://agent.example/threads/one/commands", {
    method: "POST",
    body: JSON.stringify({ method }),
  })
  if (method === "run.start") {
    const error = await tracker.fetch(request).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(tracker.wasRejected(error)).toBe(true)
  } else {
    expect(await tracker.fetch(request)).toBe(response)
    expect(await response.text()).toBe("unavailable")
  }
})

test("does not treat accepted runs, lifecycle errors, or stream HTTP failures as rejected submissions", async () => {
  const response = new Response("accepted", { status: 200 })
  const tracker = trackRunStartRejections(async () => response)
  await tracker.fetch("https://agent.example/threads/one/commands", {
    method: "POST", body: JSON.stringify({ method: "run.start" }),
  })
  expect(tracker.wasRejected({ response })).toBe(false)
  expect(tracker.wasRejected(new Error("Run failed"))).toBe(false)
  const streamResponse = new Response(null, { status: 503 })
  const streamTracker = trackRunStartRejections(async () => streamResponse)
  await streamTracker.fetch("https://agent.example/threads/one/events")
  expect(streamTracker.wasRejected({ response: streamResponse })).toBe(false)
})

test("keeps transport failures ambiguous instead of authorizing a duplicate submission", async () => {
  const error = new TypeError("connection lost")
  const tracker = trackRunStartRejections(async () => { throw error })
  await expect(tracker.fetch("https://agent.example/threads/one/commands", {
    method: "POST", body: JSON.stringify({ method: "run.start" }),
  })).rejects.toBe(error)
  expect(tracker.wasRejected(error)).toBe(false)
})
