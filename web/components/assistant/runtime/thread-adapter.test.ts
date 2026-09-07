import { describe, expect, test } from "bun:test"
import type { Client } from "@langchain/langgraph-sdk"

import {
  AegraThreadAdapter,
  deterministicThreadTitle,
} from "./thread-adapter"

describe("AegraThreadAdapter", () => {
  test("maps local IDs to server-safe remote IDs and stamps deferred metadata", async () => {
    const calls: unknown[] = []
    const client = fakeClient({
      create: async (payload: unknown) => {
        calls.push(payload)
        return thread("thread-1")
      },
    })
    const adapter = new AegraThreadAdapter(client, {
      assistantId: "blog-agent",
    })

    expect(await adapter.initialize("__LOCALID_84fIWOf")).toEqual({
      remoteId: "thread-1",
      externalId: "thread-1",
    })
    expect(calls).toEqual([
      {
        threadId: "aui-__LOCALID_84fIWOf",
        ifExists: "do_nothing",
        graphId: "blog-agent",
        metadata: {
          title: "새 대화",
          title_status: "pending",
          archived: false,
        },
      },
    ])
  })

  test("pages SDK search results and maps archived metadata", async () => {
    const rows = Array.from({ length: 21 }, (_, index) =>
      thread(`thread-${index}`, {
        title: `대화 ${index}`,
        archived: index === 0,
      })
    )
    const queries: unknown[] = []
    const client = fakeClient({
      search: async (query: unknown) => {
        queries.push(query)
        return rows
      },
    })
    const adapter = new AegraThreadAdapter(client)

    const first = await adapter.list()
    expect(first.threads).toHaveLength(20)
    expect(first.nextCursor).toBe("offset:20")
    expect(first.threads[0]).toMatchObject({
      remoteId: "thread-0",
      externalId: "thread-0",
      status: "archived",
      title: "대화 0",
    })
    expect(queries).toEqual([
      {
        limit: 21,
        offset: 0,
        sortBy: "updated_at",
        sortOrder: "desc",
      },
    ])
  })

  test("fetches persisted thread metadata through the SDK", async () => {
    const adapter = new AegraThreadAdapter(fakeClient({
      get: async (id) => thread(String(id), { title: "저장된 대화" }),
    }))
    expect(await adapter.fetch("thread-1")).toMatchObject({
      remoteId: "thread-1", title: "저장된 대화",
    })
  })

  test("renames, updates custom metadata, archives, and restores by SDK update", async () => {
    const updates: unknown[] = []
    const client = fakeClient({
      update: async (...args) => {
        updates.push(args)
      },
    })
    const adapter = new AegraThreadAdapter(client)

    await adapter.rename("thread-1", "  새   제목  ")
    await adapter.updateCustom("thread-1", { retriever: "hybrid" })
    await adapter.archive("thread-1")
    await adapter.unarchive("thread-1")

    expect(updates).toEqual([
      [
        "thread-1",
        {
          metadata: { title: "새 제목", title_status: "manual" },
          returnMinimal: true,
        },
      ],
      [
        "thread-1",
        {
          metadata: { custom: { retriever: "hybrid" } },
          returnMinimal: true,
        },
      ],
      [
        "thread-1",
        {
          metadata: { archived: true },
          returnMinimal: true,
        },
      ],
      [
        "thread-1",
        {
          metadata: { archived: false },
          returnMinimal: true,
        },
      ],
    ])
  })

  test("bounds rename and server metadata by Unicode scalar without splitting emoji", async () => {
    const updates: unknown[] = []
    const client = fakeClient({
      get: async (threadId) =>
        thread(String(threadId), {
          title: ` ${"한".repeat(47)}😀server-tail `,
        }),
      update: async (...args) => {
        updates.push(args)
      },
    })
    const adapter = new AegraThreadAdapter(client)

    await adapter.rename("thread-1", `${"가".repeat(47)}😀ignored`)
    expect(await adapter.fetch("thread-1")).toMatchObject({
      title: `${"한".repeat(47)}😀`,
    })
    expect(updates).toEqual([
      [
        "thread-1",
        {
          metadata: {
            title: `${"가".repeat(47)}😀`,
            title_status: "manual",
          },
          returnMinimal: true,
        },
      ],
    ])
    expect(
      JSON.stringify(updates).match(/[\ud800-\udbff](?![\udc00-\udfff])/u)
    ).toBeNull()
  })

  test("always rejects deletion because Aegra cannot delete atomically", async () => {
    const adapter = new AegraThreadAdapter(fakeClient({}))
    await expect(adapter.delete("thread-1")).rejects.toThrow(
      "원자적으로 삭제할 수 없어"
    )
  })

  test("generates a deterministic deferred title and persists it", async () => {
    const updates: unknown[] = []
    const client = fakeClient({
      update: async (...args: unknown[]) => {
        updates.push(args)
      },
    })
    const adapter = new AegraThreadAdapter(client)
    const longQuestion =
      "이 블로그에서 LangGraph와 Aegra를 함께 사용하는 방법을 자세히 설명해주고 관련 글도 모두 찾아줘"

    const generated = deterministicThreadTitle([
      {
        role: "user",
        content: [{ type: "text", text: longQuestion }],
      },
    ])
    expect(Array.from(generated)).toHaveLength(48)
    expect(generated.endsWith("…")).toBe(true)

    const scalarBoundary = deterministicThreadTitle([
      {
        role: "user",
        content: `${"한".repeat(47)}😀tail`,
      },
    ])
    expect(scalarBoundary).toBe(`${"한".repeat(47)}…`)
    expect(Array.from(scalarBoundary)).toHaveLength(48)
    expect(
      scalarBoundary.match(/[\ud800-\udbff](?![\udc00-\udfff])/u)
    ).toBeNull()

    const stream = await adapter.generateTitle("thread-1", [
      { role: "user", content: "도커 글을 찾아줘" },
    ])
    const chunks = []
    const reader = stream.getReader()
    while (true) {
      const result = await reader.read()
      if (result.done) break
      chunks.push(result.value)
    }
    expect(chunks).toContainEqual({
      type: "text-delta",
      path: [0],
      textDelta: "도커 글을 찾아줘",
    })
    expect(updates).toEqual([
      [
        "thread-1",
        {
          metadata: {
            title: "도커 글을 찾아줘",
            title_status: "generated",
          },
          returnMinimal: true,
        },
      ],
    ])
  })
})

interface FakeOverrides {
  create?: (payload: unknown) => Promise<unknown>
  search?: (query: unknown) => Promise<unknown>
  get?: (threadId: unknown) => Promise<unknown>
  getState?: () => Promise<unknown>
  getHistory?: (...args: unknown[]) => Promise<unknown>
  update?: (...args: unknown[]) => Promise<unknown>
}

function fakeClient(overrides: FakeOverrides): Client {
  return {
    threads: {
      create: overrides.create,
      search: overrides.search,
      get: overrides.get,
      getState: overrides.getState,
      getHistory: overrides.getHistory,
      update: overrides.update,
    },
  } as unknown as Client
}

function thread(
  id: string,
  metadata: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    thread_id: id,
    created_at: "2026-07-27T00:00:00.000Z",
    updated_at: "2026-07-27T01:00:00.000Z",
    state_updated_at: "2026-07-27T01:00:00.000Z",
    metadata,
    status: "idle",
    values: {},
    interrupts: {},
  }
}
