import { Client } from "@langchain/langgraph-sdk"

const API_URL = "https://portfolio-ai-194616966170.asia-northeast3.run.app"

// Singleton pattern for client instance
// Client provides async methods by default
let clientInstance: Client | null = null

export function getApiClient(): Client {
  if (!clientInstance) {
    clientInstance = new Client({
      apiUrl: API_URL,
    })
  }
  return clientInstance
}

export interface StreamChatOptions {
  userMessage: string
  onChunk?: (content: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

export async function streamChatResponse({
  userMessage,
  onChunk,
  onComplete,
  onError,
}: StreamChatOptions): Promise<string> {
  try {
    const client = getApiClient()

    const stream = client.runs.stream(
      null, // thread_id (stateless)
      "agent",
      {
        input: { messages: [{ role: "user", content: userMessage }] },
        streamMode: "messages",
      }
    )

    let fullContent = ""

    for await (const chunk of stream) {
      if (chunk.event === "messages/partial" && chunk.data) {
        const messageChunks = Array.isArray(chunk.data)
          ? chunk.data
          : [chunk.data]

        for (const msg of messageChunks) {
          if (msg.content) {
            fullContent += msg.content
            onChunk?.(fullContent)
          }
        }
      }
    }

    onComplete?.(fullContent)
    return fullContent
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    onError?.(err)
    throw err
  }
}
