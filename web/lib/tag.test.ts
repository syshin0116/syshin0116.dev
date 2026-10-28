import { describe, expect, test } from "bun:test"
import { findTagSpellingVariants, mergedTagTarget } from "./tag"

describe("mergedTagTarget", () => {
  test("resolves case and punctuation variants to the surviving tag", () => {
    const tags = ["rag", "machine-learning", "Nextjs"]
    expect(mergedTagTarget("RAG", tags)).toBe("rag")
    expect(mergedTagTarget("Machine Learning", tags)).toBe("machine-learning")
    expect(mergedTagTarget("Next.js", tags)).toBe("Nextjs")
  })

  test("leaves unknown and ambiguous spellings unresolved", () => {
    expect(mergedTagTarget("없는-태그", ["rag"])).toBeUndefined()
    expect(mergedTagTarget("REACT", ["ReAct", "react"])).toBeUndefined()
    expect(mergedTagTarget("rag", ["rag"])).toBeUndefined()
  })
})

describe("findTagSpellingVariants", () => {
  test("reports spellings that would split one tag page, with their files", () => {
    const filesByTag = new Map([
      ["AI", ["content/AI/post.md"]],
      ["ai", ["content/wiki/concepts/page.md"]],
      ["Machine Learning", ["content/Study/a.md"]],
      ["machine-learning", ["content/Study/b.md", "content/wiki/topics/ml.md"]],
      ["RAG", ["content/AI/rag.md"]],
    ])
    expect(findTagSpellingVariants(filesByTag)).toEqual([
      [
        { tag: "AI", files: ["content/AI/post.md"] },
        { tag: "ai", files: ["content/wiki/concepts/page.md"] },
      ],
      [
        { tag: "Machine Learning", files: ["content/Study/a.md"] },
        { tag: "machine-learning", files: ["content/Study/b.md", "content/wiki/topics/ml.md"] },
      ],
    ])
  })

  test("keeps spellings listed as distinct concepts apart", () => {
    const filesByTag = new Map([
      ["ReAct", ["content/AI/agent.md"]],
      ["react", ["content/Dev/web.md"]],
    ])
    expect(findTagSpellingVariants(filesByTag)).toEqual([])
    filesByTag.set("REACT", ["content/Dev/other.md"])
    expect(findTagSpellingVariants(filesByTag)).toHaveLength(1)
  })
})
