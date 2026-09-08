import { expect, test } from "bun:test"
import { resolveChatImage } from "./chat-images"

test("resolves the image URL observed in LangSmith without guessing ambiguous assets", () => {
  const paths = ["AI/assets/agent-state-sync-boundaries.svg", "AI/assets/그림 1.png"]
  expect(resolveChatImage("https://syshin0116.vercel.app/assets/agent-state-sync-boundaries.svg", paths))
    .toBe("/content/AI/assets/agent-state-sync-boundaries.svg")
  expect(resolveChatImage("assets/그림%201.png", paths)).toBe("/content/AI/assets/%EA%B7%B8%EB%A6%BC%201.png")
  expect(resolveChatImage("/assets/agent-state-sync-boundaries.svg", [...paths, "Dev/assets/agent-state-sync-boundaries.svg"]))
    .toBeNull()
  expect(resolveChatImage("/content/AI/assets/agent-state-sync-boundaries.svg", paths)).toBe("/content/AI/assets/agent-state-sync-boundaries.svg")
  expect(resolveChatImage("https://example.com/photo.png", paths)).toBe("https://example.com/photo.png")
  for (const src of ["https://[invalid", "javascript:alert(1)", "data:image/svg+xml,x", "//example.com/a.svg", "/content/../secret.png", "/assets/missing.png"])
    expect(resolveChatImage(src, paths)).toBeNull()
})
