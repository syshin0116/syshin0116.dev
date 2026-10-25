import { describe, expect, test } from "bun:test"
import { brokenLinks, missingDescription, type SiteIndex } from "./verify-rendered-pages"

const site: SiteIndex = {
  pageSlugs: new Set(["AI/2025-01-01-RAG"]),
  folderSlugs: new Set(["AI"]),
  tags: new Set(["RAG", "검색 노출"]),
  publicFiles: new Set(["/images/blog/graph.svg"]),
  contentFileExists: contentPath => contentPath === "AI/assets/figure.png",
}

function linksIn(html: string): string[] {
  return brokenLinks({ slug: "AI/post", html, frontmatter: {} }, site)
}

describe("brokenLinks", () => {
  test("accepts every route a rendered body can point at", () => {
    expect(
      linksIn(
        [
          '<a href="/blog/AI/2025-01-01-RAG#setup">post</a>',
          '<a href="/blog/AI">folder</a>',
          `<a href="/blog/tags/${encodeURIComponent("검색 노출")}">tag</a>`,
          '<img src="/blog/api/content/AI/assets/figure.png">',
          '<img src="/images/blog/graph.svg">',
          '<a href="/projects">projects</a>',
          '<a href="https://example.com/a#b">external</a>',
          '<a href="#section">anchor</a>',
          '<a href="mailto:me@example.com">mail</a>',
        ].join(""),
      ),
    ).toEqual([])
  })

  test("reports the link shapes that used to render as 404s", () => {
    const problems = linksIn(
      [
        '<a href="/tags/RAG">hashtag without the blog prefix</a>',
        '<a href="/blog/AI/2025-01-01-Missing">deleted post</a>',
        '<a href="../Dev/Other.md">relative markdown link</a>',
        '<img src="/blog/api/content/AI/assets/missing.png">',
        '<a href="/blog/tags/unknown">unknown tag</a>',
        '<a href="">empty</a>',
      ].join(""),
    )
    expect(problems).toHaveLength(6)
    expect(problems[0]).toContain('href="/tags/RAG"')
    expect(problems[2]).toContain("relative URL")
  })

  test("decodes HTML entities before resolving", () => {
    expect(linksIn('<a href="/blog/AI/2025-01-01-RAG?a=1&amp;b=2">post</a>')).toEqual([])
  })
})

describe("missingDescription", () => {
  test("falls back to the first paragraph and exempts index pages", () => {
    expect(missingDescription({ slug: "AI/post", html: "<p>본문 첫 문단</p>", frontmatter: {} })).toBeUndefined()
    expect(missingDescription({ slug: "AI/post", html: "<pre>code</pre>", frontmatter: {} })).toContain("no description")
    expect(missingDescription({ slug: "wiki/log", html: "", frontmatter: {} })).toBeUndefined()
  })
})
