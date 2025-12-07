"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { ScrollButton } from "@/components/ui/scroll-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  Copy,
  Globe,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash,
} from "lucide-react"
import { useState } from "react"
import { streamChatResponse, ToolCall, ToolResult, SourceInfo } from "@/lib/api-client"
import { Loader } from "@/components/ui/loader"
import { Tool, ToolPart } from "@/components/ui/tool"
import { Source, SourceTrigger, SourceContent } from "@/components/ui/source"

interface ChatMessage {
  id: number
  role: "user" | "assistant"
  content: string
  toolCalls?: Map<string, ToolPart>
  sources?: SourceInfo[]
}

export default function ChatSection() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    const userPrompt = prompt.trim()
    setPrompt("")
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userPrompt,
    }

    setChatMessages((prev) => [...prev, newUserMessage])

    // Create assistant message placeholder
    const assistantMessageId = Date.now() + 1
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      toolCalls: new Map(),
      sources: [],
    }

    setChatMessages((prev) => [...prev, assistantMessage])

    // Stream the response using the API client
    await streamChatResponse({
      userMessage: userPrompt,
      onChunk: (fullContent) => {
        // Update the assistant message with accumulated content
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fullContent } : m
          )
        )
      },
      onToolCall: (toolCall: ToolCall) => {
        // Add or update tool call
        setChatMessages((prev) =>
          prev.map((m) => {
            if (m.id === assistantMessageId) {
              const newToolCalls = new Map(m.toolCalls)
              newToolCalls.set(toolCall.id, {
                type: toolCall.name,
                state: "input-available",
                input: toolCall.args,
                toolCallId: toolCall.id,
              })
              return { ...m, toolCalls: newToolCalls }
            }
            return m
          })
        )
      },
      onToolResult: (toolResult: ToolResult) => {
        // Update tool call with result
        setChatMessages((prev) =>
          prev.map((m) => {
            if (m.id === assistantMessageId) {
              const newToolCalls = new Map(m.toolCalls)
              const existingTool = newToolCalls.get(toolResult.tool_call_id)
              if (existingTool) {
                newToolCalls.set(toolResult.tool_call_id, {
                  ...existingTool,
                  state: "output-available",
                  output: { result: toolResult.content },
                })
              }
              return { ...m, toolCalls: newToolCalls }
            }
            return m
          })
        )
      },
      onSources: (sources: SourceInfo[]) => {
        // Update assistant message with sources
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, sources } : m
          )
        )
      },
      onComplete: () => {
        setIsLoading(false)
      },
      onError: (error) => {
        console.error("Error streaming response:", error)

        // Update with error message
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: "Sorry, I encountered an error. Please try again.",
                }
              : m
          )
        )

        setIsLoading(false)
      },
    })
  }

  return (
    <section className="w-full h-[100dvh] md:h-[calc(100vh-73px)] flex flex-col">
      <div className="container mx-auto px-4 md:px-6 py-8 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex flex-col items-center space-y-4 text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Ask Me Anything
          </h1>
          <p className="text-muted-foreground max-w-[700px] text-base md:text-lg">
            Chat with AI about my projects, blog posts, and technical experience
          </p>
        </div>

        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0">
          <div className="relative flex flex-col flex-1 overflow-hidden min-h-0">
            <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto px-4 py-8">
              <ChatContainerContent className="space-y-8 px-4 py-8">
                {chatMessages.map((message, index) => {
                  const isAssistant = message.role === "assistant"
                  const isLastMessage = index === chatMessages.length - 1

                  return (
                    <Message
                      key={message.id}
                      className={cn(
                        "mx-auto flex w-full max-w-full flex-col gap-2 px-0",
                        isAssistant ? "items-start" : "items-end"
                      )}
                    >
                      {isAssistant ? (
                        <div className="group flex w-full flex-col gap-0">
                          {/* Tool calls display */}
                          {message.toolCalls && message.toolCalls.size > 0 && (
                            <div className="mb-4 space-y-2">
                              {Array.from(message.toolCalls.values()).map((toolPart) => (
                                <Tool
                                  key={toolPart.toolCallId}
                                  toolPart={toolPart}
                                  defaultOpen={false}
                                />
                              ))}
                            </div>
                          )}

                          {/* Message content */}
                          {message.content ? (
                            <MessageContent
                              className="text-foreground prose w-full flex-1 rounded-lg bg-transparent p-0"
                              markdown
                            >
                              {message.content}
                            </MessageContent>
                          ) : !message.toolCalls || message.toolCalls.size === 0 ? (
                            <div className="text-foreground w-full flex-1 rounded-lg bg-transparent p-0">
                              <Loader variant="text-shimmer" text="Thinking" size="md" />
                            </div>
                          ) : null}

                          {/* Sources display */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.sources.map((source, idx) => (
                                <Source key={idx} href={source.url}>
                                  <SourceTrigger 
                                    label={idx + 1}
                                    showFavicon={true}
                                  />
                                  <SourceContent
                                    title={source.title}
                                    description={source.summary || ""}
                                  />
                                </Source>
                              ))}
                            </div>
                          )}

                          <MessageActions
                            className={cn(
                              "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                              isLastMessage && "opacity-100"
                            )}
                          >
                            <MessageAction tooltip="Copy" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <Copy />
                              </Button>
                            </MessageAction>
                            <MessageAction tooltip="Upvote" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <ThumbsUp />
                              </Button>
                            </MessageAction>
                            <MessageAction tooltip="Downvote" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <ThumbsDown />
                              </Button>
                            </MessageAction>
                          </MessageActions>
                        </div>
                      ) : (
                        <div className="group flex flex-col items-end gap-1 w-full">
                          <MessageContent className="bg-muted text-primary max-w-full rounded-3xl px-5 py-2.5 sm:max-w-[85%] md:max-w-[75%]">
                            {message.content}
                          </MessageContent>
                          <MessageActions
                            className={cn(
                              "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                            )}
                          >
                            <MessageAction tooltip="Edit" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <Pencil />
                              </Button>
                            </MessageAction>
                            <MessageAction tooltip="Delete" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <Trash />
                              </Button>
                            </MessageAction>
                            <MessageAction tooltip="Copy" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <Copy />
                              </Button>
                            </MessageAction>
                          </MessageActions>
                        </div>
                      )}
                    </Message>
                  )
                })}
                <ChatContainerScrollAnchor />
              </ChatContainerContent>

              <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10">
                <ScrollButton
                  className="bg-background/80 hover:bg-background/90 backdrop-blur-sm shadow-lg border border-border/50"
                  variant="outline"
                  size="icon"
                />
              </div>
            </ChatContainerRoot>

            <div className="sticky bottom-0 left-0 right-0 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 p-4">
              <div className="max-w-5xl mx-auto">
                <PromptInput
                  isLoading={isLoading}
                  value={prompt}
                  onValueChange={setPrompt}
                  onSubmit={handleSubmit}
                  className="border-input bg-background relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-sm"
                >
                <div className="flex flex-col">
                  <PromptInputTextarea
                    placeholder="Ask anything..."
                    className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3]"
                  />

                  <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <PromptInputAction tooltip="Add attachment">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full"
                        >
                          <Plus size={18} />
                        </Button>
                      </PromptInputAction>

                      <PromptInputAction tooltip="Search web">
                        <Button variant="outline" className="rounded-full">
                          <Globe size={18} />
                          Search
                        </Button>
                      </PromptInputAction>

                      <PromptInputAction tooltip="More options">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full"
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                      </PromptInputAction>
                    </div>
                    <div className="flex items-center gap-2">
                      <PromptInputAction tooltip="Voice input">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full"
                        >
                          <Mic size={18} />
                        </Button>
                      </PromptInputAction>

                      <Button
                        size="icon"
                        disabled={!prompt.trim() || isLoading}
                        onClick={handleSubmit}
                        className="size-9 rounded-full"
                      >
                        {!isLoading ? (
                          <ArrowUp size={18} />
                        ) : (
                          <span className="size-3 rounded-xs bg-white" />
                        )}
                      </Button>
                    </div>
                  </PromptInputActions>
                </div>
              </PromptInput>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
