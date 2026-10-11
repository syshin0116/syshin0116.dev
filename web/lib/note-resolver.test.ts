import { describe, expect, test } from "bun:test"
import { createLinkResolver } from "./note-resolver"

const { resolve, resolvePath } = createLinkResolver([
  { slug: "Tools/Git/2024-11-09-정리-Github CI CD - GCP", frontmatter: {} },
  { slug: "AI/MCP(Model Context Protocal)", frontmatter: { title: "MCP(Model Context Protocol)" } },
  { slug: "AI/2025-01-01-Shared", frontmatter: { title: "Same Title" } },
  { slug: "Dev/2025-02-02-Shared", frontmatter: { title: "Same Title" } },
  { slug: "AI/2025-03-03-Twin", frontmatter: {} },
  { slug: "Dev/2025-04-04-Twin", frontmatter: {} },
  { slug: "Tools/Elsewhere", frontmatter: { title: "Twin" } },
  { slug: "Dev/about", frontmatter: {} },
])

describe("createLinkResolver", () => {
  test("keeps nuartz filename resolution first", () => {
    expect(resolve("MCP(Model Context Protocal)")).toBe("AI/MCP(Model Context Protocal)")
  })

  test("resolves a filename written without its date prefix", () => {
    expect(resolve("정리-Github CI CD - GCP")).toBe("Tools/Git/2024-11-09-정리-Github CI CD - GCP")
  })

  test("resolves a link written as the note title", () => {
    expect(resolve("MCP(Model Context Protocol)")).toBe("AI/MCP(Model Context Protocal)")
  })

  test("leaves ambiguous and missing targets unresolved", () => {
    expect(resolve("Shared")).toBeUndefined()
    expect(resolve("Same Title")).toBeUndefined()
    expect(resolve("Twin")).toBeUndefined()
    expect(resolve("Never Written")).toBeUndefined()
  })

  test("path lookup matches only full content paths", () => {
    expect(resolvePath("Dev/about")).toBe("Dev/about")
    expect(resolvePath("about")).toBeUndefined()
  })
})
