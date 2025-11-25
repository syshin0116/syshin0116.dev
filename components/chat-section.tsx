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

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm Syshin's AI assistant. Feel free to ask me anything about my projects, skills, or experience!",
  },
]

export default function ChatSection() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState(initialMessages)

  const handleSubmit = () => {
    if (!prompt.trim()) return

    const userPrompt = prompt.trim()
    setPrompt("")
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage = {
      id: Date.now(),
      role: "user",
      content: userPrompt,
    }

    setChatMessages((prev) => [...prev, newUserMessage])

    // Simulate API response
    setTimeout(() => {
      const assistantResponse = {
        id: Date.now(),
        role: "assistant",
        content: `Thanks for your question: "${userPrompt}". This is a demo response. In production, this would connect to an AI API.`,
      }

      setChatMessages((prev) => [...prev, assistantResponse])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <section className="w-full h-[calc(100vh-73px)] flex flex-col">
      <div className="container mx-auto px-4 md:px-6 py-8 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col items-center space-y-4 text-center mb-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Compare 4 RAG Systems
          </h1>
          <p className="text-muted-foreground max-w-[700px] text-lg md:text-xl">
            Ask questions about my blog posts and see how different RAG approaches retrieve and answer.
          </p>
        </div>

        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0">
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
                        "mx-auto flex w-full max-w-5xl flex-col gap-2 px-0",
                        isAssistant ? "items-start" : "items-end"
                      )}
                    >
                      {isAssistant ? (
                        <div className="group flex w-full flex-col gap-0">
                          <MessageContent
                            className="text-foreground prose w-full flex-1 rounded-lg bg-transparent p-0"
                            markdown
                          >
                            {message.content}
                          </MessageContent>
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
                        <div className="group flex flex-col items-end gap-1">
                          <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]">
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

              <div className="absolute right-7 bottom-4 z-10">
                <ScrollButton
                  className="bg-primary hover:bg-primary/90 shadow-sm"
                  variant="default"
                  size="icon"
                />
              </div>
            </ChatContainerRoot>

            <div className="shrink-0 p-4">
              <div className="max-w-3xl mx-auto">
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
