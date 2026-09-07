import { expect, test } from "bun:test"

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text()

test("delegates APv2 transport to the official runtime", async () => {
  const provider = await read("../agent-runtime-provider.tsx")
  expect(provider).toContain("useStreamRuntime({")
  expect(provider).toContain('streamProtocol: "v2"')
  expect(provider).toContain("unstable_threadListAdapter: threadAdapter")
  for (const removed of ["native-client.ts", "thread-source.ts", "sse.ts"]) {
    expect(await Bun.file(new URL(removed, import.meta.url)).exists()).toBe(false)
  }
})

test("keeps unsupported history mutation and raw interrupt payloads out of the UI", async () => {
  const shell = await read("../chat-shell.tsx")
  for (const primitive of [
    "MessagePrimitive.Edit", "MessagePrimitive.Reload",
    "BranchPickerPrimitive", "ThreadListItemPrimitive.Delete",
  ]) expect(shell).not.toContain(primitive)
  expect(shell).toContain("projectInterruptForUi(interrupt.value)")
  expect(shell).not.toContain("JSON.stringify(interrupt")
  expect(shell).not.toContain("{interrupt.value}")
  expect(shell).not.toContain("코퍼스 리비전")
})
