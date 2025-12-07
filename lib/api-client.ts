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

export interface ToolCall {
  name: string
  args: Record<string, unknown>
  id: string
  type?: string
}

export interface ToolResult {
  name: string
  content: string
  tool_call_id: string
}

export interface StreamChatOptions {
  userMessage: string
  onChunk?: (content: string) => void
  onToolCall?: (toolCall: ToolCall) => void
  onToolResult?: (toolResult: ToolResult) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

export async function streamChatResponse({
  userMessage,
  onChunk,
  onToolCall,
  onToolResult,
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
          // Handle tool calls - bypass strict typing for streaming chunks
          const msgAny = msg as Record<string, unknown>

          if (msgAny.tool_calls && Array.isArray(msgAny.tool_calls) && msgAny.tool_calls.length > 0) {
            for (const toolCall of msgAny.tool_calls) {
              if (toolCall.name && toolCall.id) {
                // Parse args if it's a string (streaming chunks)
                let parsedArgs = toolCall.args
                if (typeof toolCall.args === "string") {
                  try {
                    parsedArgs = JSON.parse(toolCall.args)
                  } catch {
                    parsedArgs = { raw: toolCall.args }
                  }
                }

                onToolCall?.({
                  name: toolCall.name,
                  args: parsedArgs || {},
                  id: toolCall.id,
                  type: toolCall.type,
                })
              }
            }
          }

          // Handle tool results
          if (msgAny.type === "tool" && msgAny.name && msgAny.tool_call_id) {
            const content = typeof msgAny.content === "string"
              ? msgAny.content
              : JSON.stringify(msgAny.content)

            onToolResult?.({
              name: String(msgAny.name),
              content,
              tool_call_id: String(msgAny.tool_call_id),
            })
          }

          // Handle regular content
          if (msg.content && msgAny.type !== "tool") {
            const content = typeof msg.content === "string"
              ? msg.content
              : ""
            fullContent += content
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
