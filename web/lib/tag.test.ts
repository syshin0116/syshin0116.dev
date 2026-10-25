import { describe, expect, test } from "bun:test"
import { mergedTagTarget } from "./tag"

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
