import { describe, expect, test } from "bun:test"
import { blogPath, createPermalinks, permalinks } from "./blog-permalinks"

describe("blog permalinks", () => {
  test("reuses the filename topic and resolves both URLs to the same source", () => {
    const source = "AI/2025-06-04-Agent Architecture Comparison"
    expect(blogPath(source)).toBe("/blog/agent-architecture-comparison")
    expect(permalinks.sourceSlug("agent-architecture-comparison")).toBe(source)
    expect(permalinks.sourceSlug(source)).toBe(source)
  })

  test("a file move preserves the public URL and original discussion path", () => {
    const links = createPermalinks({ persistence: { source: "AI/new", aliases: ["Dev/old"] } })
    expect(links.publicSlug("Dev/old")).toBe("persistence")
    expect(links.sourceSlug("Dev/old")).toBe("AI/new")
    expect(links.discussionTerm("AI/new")).toBe("blog/Dev/old")
    expect(links.originalPath("AI/new")).toBe("/blog/Dev/old")
    expect(() => links.validateSources(["AI/new", "Dev/old"])).toThrow("Alias still exists")
  })

  test("comments preserve browser pathname encoding while RSS preserves its original GUID encoding", () => {
    const links = createPermalinks({ note: { source: "AI/한글: notes" } })
    expect(links.discussionTerm("note")).toBe("blog/AI/%ED%95%9C%EA%B8%80:%20notes")
    expect(links.originalPath("note")).toBe("/blog/AI/%ED%95%9C%EA%B8%80%3A%20notes")
  })

  test("unknown folders remain addressable and non-ASCII paths are encoded", () => {
    expect(blogPath("Study/새 폴더")).toBe("/blog/Study/%EC%83%88%20%ED%8F%B4%EB%8D%94")
    expect(permalinks.sourceSlug("missing")).toBe("missing")
  })

  test("rejects duplicate sources and aliases that steal another permalink", () => {
    expect(() => createPermalinks({ a: { source: "AI/one" }, b: { source: "AI/one" } })).toThrow("Conflicting")
    expect(() => createPermalinks({ a: { source: "AI/one", aliases: ["b"] }, b: { source: "AI/two" } })).toThrow("Conflicting")
  })

  test("rejects reserved names, unsafe paths, and non-ASCII public slugs", () => {
    for (const slug of ["api", "tags", "page", "index", "한글", "two/parts", "bad?query", "Uppercase"]) {
      expect(() => createPermalinks({ [slug]: { source: "AI/one" } })).toThrow()
    }
    expect(() => createPermalinks({ valid: { source: "../secret" } })).toThrow()
    expect(() => createPermalinks({ valid: { source: "AI/one", aliases: ["api/search"] } })).toThrow()
  })

  test("requires a mapping and prevents taking folder or frontmatter alias URLs", () => {
    const links = createPermalinks({ topic: { source: "AI/post" }, nested: { source: "topic/child" } })
    expect(() => links.validateSources(["AI/missing"])).toThrow("Missing")
    expect(() => links.validateSources(["AI/post", "topic/child"])).toThrow("Conflicting")
    expect(() => links.validateSources(["AI/post"], { topic: "Dev/other" })).toThrow("Conflicting")
  })
})
