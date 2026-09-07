import type {
  Client,
  Thread,
} from "@langchain/langgraph-sdk"
import type {
  RemoteThreadListAdapter,
} from "@assistant-ui/react"

const PAGE_SIZE = 20
const DEFAULT_TITLE = "새 대화"
const MAX_TITLE_LENGTH = 48

type TitleStream = Awaited<
  ReturnType<RemoteThreadListAdapter["generateTitle"]>
>
type RemoteThreadMetadata = Awaited<
  ReturnType<RemoteThreadListAdapter["fetch"]>
>
type TitleStreamChunk =
  TitleStream extends ReadableStream<infer Chunk> ? Chunk : never

interface AegraThreadAdapterOptions {
  assistantId?: string

}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed
}

function unicodeScalars(value: string): string[] {
  return Array.from(value, (scalar) => {
    const codePoint = scalar.codePointAt(0)
    return codePoint !== undefined &&
      codePoint >= 0xd800 &&
      codePoint <= 0xdfff
      ? "\ufffd"
      : scalar
  })
}

function boundedTitle(value: string, ellipsis: boolean): string {
  const normalized = value.replace(/\s+/gu, " ").trim()
  const scalars = unicodeScalars(normalized)
  if (scalars.length <= MAX_TITLE_LENGTH) return scalars.join("")
  const visibleScalars = ellipsis
    ? scalars.slice(0, MAX_TITLE_LENGTH - 1)
    : scalars.slice(0, MAX_TITLE_LENGTH)
  return `${visibleScalars.join("").trimEnd()}${ellipsis ? "…" : ""}`
}

function metadataTitle(metadata: Record<string, unknown>): string | undefined {
  if (typeof metadata.title !== "string") return undefined
  const title = boundedTitle(metadata.title, false)
  return title || undefined
}

function toRemoteMetadata(
  thread: Thread<Record<string, unknown>>
): RemoteThreadMetadata {
  const metadata = thread.metadata as Record<string, unknown>
  return {
    remoteId: thread.thread_id,
    externalId: thread.thread_id,
    status: metadata.archived === true ? "archived" : "regular",
    title: metadataTitle(metadata) ?? DEFAULT_TITLE,
    lastMessageAt:
      parseDate(thread.state_updated_at) ?? parseDate(thread.updated_at),
    custom: isRecord(metadata.custom) ? metadata.custom : undefined,
  }
}

function encodeCursor(offset: number): string {
  return `offset:${offset}`
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0
  const match = /^offset:(\d+)$/.exec(cursor)
  if (!match) throw new Error("대화 목록 커서가 올바르지 않습니다.")
  return Number(match[1])
}

function contentText(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .map((part) =>
      isRecord(part) && typeof part.text === "string" ? part.text : ""
    )
    .filter(Boolean)
    .join(" ")
}

export function deterministicThreadTitle(
  messages: readonly unknown[]
): string {
  for (const message of messages) {
    if (!isRecord(message) || message.role !== "user") continue
    const normalized = boundedTitle(contentText(message.content), true)
    if (!normalized) continue
    return normalized
  }
  return DEFAULT_TITLE
}

function titleStream(title: string): TitleStream {
  return new ReadableStream<TitleStreamChunk>({
    start(controller) {
      controller.enqueue({
        type: "part-start",
        path: [],
        part: { type: "text" },
      } as TitleStreamChunk)
      controller.enqueue({
        type: "text-delta",
        path: [0],
        textDelta: title,
      } as TitleStreamChunk)
      controller.enqueue({
        type: "part-finish",
        path: [0],
      } as TitleStreamChunk)
      controller.close()
    },
  })
}

export class AegraThreadAdapter implements RemoteThreadListAdapter {
  readonly #client: Client
  readonly #assistantId: string

  constructor(client: Client, options: AegraThreadAdapterOptions = {}) {
    this.#client = client
    this.#assistantId = options.assistantId ?? "agent"
  }

  async list(params?: { after?: string }) {
    const offset = decodeCursor(params?.after)
    const rows = await this.#client.threads.search<Record<string, unknown>>({
      limit: PAGE_SIZE + 1,
      offset,
      sortBy: "updated_at",
      sortOrder: "desc",
    })
    const hasNextPage = rows.length > PAGE_SIZE
    return {
      threads: rows.slice(0, PAGE_SIZE).map(toRemoteMetadata),
      ...(hasNextPage ? { nextCursor: encodeCursor(offset + PAGE_SIZE) } : {}),
    }
  }

  async initialize(threadId: string) {
    const remoteThreadId = `aui-${threadId}`
    const thread = await this.#client.threads.create({
      threadId: remoteThreadId,
      ifExists: "do_nothing",
      graphId: this.#assistantId,
      metadata: {
        title: DEFAULT_TITLE,
        title_status: "pending",
        archived: false,
      },
    })
    return {
      remoteId: thread.thread_id,
      externalId: thread.thread_id,
    }
  }

  async fetch(threadId: string) {
    return toRemoteMetadata(
      await this.#client.threads.get<Record<string, unknown>>(threadId)
    )
  }

  async rename(remoteId: string, newTitle: string) {
    const title = boundedTitle(newTitle, false)
    if (!title) throw new Error("대화 제목을 입력해 주세요.")
    await this.#client.threads.update(remoteId, {
      metadata: {
        title,
        title_status: "manual",
      },
      returnMinimal: true,
    })
  }

  async updateCustom(
    remoteId: string,
    custom: Record<string, unknown> | undefined
  ) {
    await this.#client.threads.update(remoteId, {
      metadata: { custom: custom ?? {} },
      returnMinimal: true,
    })
  }

  async archive(remoteId: string) {
    await this.#client.threads.update(remoteId, {
      metadata: { archived: true },
      returnMinimal: true,
    })
  }

  async unarchive(remoteId: string) {
    await this.#client.threads.update(remoteId, {
      metadata: { archived: false },
      returnMinimal: true,
    })
  }

  async delete(remoteId: string): Promise<never> {
    void remoteId
    throw new Error(
      "이 서버는 체크포인트와 메타데이터를 원자적으로 삭제할 수 없어 대화 삭제를 지원하지 않습니다."
    )
  }

  async generateTitle(remoteId: string, messages: readonly unknown[]) {
    const title = deterministicThreadTitle(messages)
    await this.#client.threads.update(remoteId, {
      metadata: {
        title,
        title_status: "generated",
      },
      returnMinimal: true,
    })
    return titleStream(title)
  }

}

export const threadAdapterTesting = {
  boundedTitle,
  decodeCursor,
  encodeCursor,
  titleStream,
  toRemoteMetadata,
}
