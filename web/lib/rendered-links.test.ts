import { describe, expect, test } from "bun:test"
import { renderMarkdown } from "nuartz/markdown"
import { rewriteRenderedLinks, type RenderedLinkContext } from "./rendered-links"
import { tagPath } from "./tag"

const notes = new Map([
  ["ai/2026-05-18-tech-intelligence-radar", "AI/2026-05-18-Tech-Intelligence-Radar"],
  ["dev/2026-07-16-azure-b시리즈-cpu-크레딧", "Dev/2026-07-16-Azure B시리즈 CPU 크레딧"],
])
const media = new Set(["AI/assets/diagram.png"])

const context: RenderedLinkContext = {
  from: "wiki/radar",
  resolveNotePath: contentPath => notes.get(contentPath.toLowerCase().replace(/\s+/g, "-")),
  notePath: source => `/blog/${source.split("/").map(encodeURIComponent).join("/")}`,
  isPublishedMedia: contentPath => media.has(contentPath),
}

async function render(markdown: string, from = context.from) {
  const { html } = await renderMarkdown(markdown, {
    baseUrl: "/blog/",
    knownSlugs: new Set(["AI/known"]),
    resolveLink: target => `/blog/${target === "known" ? "AI/known" : target}`,
    resolveTag: tag => `/blog/tags/${tagPath(tag)}`,
  })
  return rewriteRenderedLinks(html, { ...context, from })
}

describe("rewriteRenderedLinks", () => {
  test("inline tag links keep their /blog/tags href", async () => {
    const html = await render("본문 #nested/child")
    expect(html).toBe('<p>본문 <a href="/blog/tags/nested/child" class="tag" data-tag="nested/child">#nested/child</a></p>')
  })

  test("unresolved wikilinks render as text instead of a 404 link", async () => {
    const html = await render("[[Never Written|그 글]] and [[known]]")
    expect(html).toContain('<span class="wikilink broken" data-target="Never Written">그 글</span>')
    expect(html).toContain('<a href="/blog/AI/known" class="wikilink" data-target="known">known</a>')
  })

  test("relative .md links resolve to the note permalink and keep the anchor", async () => {
    const html = await render("[radar](../AI/2026-05-18-Tech-Intelligence-Radar.md#scoring)")
    expect(html).toContain('href="/blog/AI/2026-05-18-Tech-Intelligence-Radar#scoring"')
  })

  test("root-relative content paths without /blog resolve to the note", async () => {
    const html = await render("[지난 글](/Dev/2026-07-16-Azure-B시리즈-CPU-크레딧)", "Dev/later")
    expect(html).toContain(`href="/blog/Dev/2026-07-16-Azure%20B${encodeURIComponent("시리즈")}%20CPU%20${encodeURIComponent("크레딧")}"`)
  })

  test("relative links to published media go to the content API", async () => {
    const html = await render("![diagram](assets/diagram.png)", "AI/post")
    expect(html).toContain('src="/blog/api/content/AI/assets/diagram.png"')
  })

  test("media links keep their query and fragment", async () => {
    const html = await render("[diagram](assets/diagram.png#zoom)", "AI/post")
    expect(html).toContain('href="/blog/api/content/AI/assets/diagram.png#zoom"')
  })

  test("site routes, external URLs and unknown paths are left alone", async () => {
    const markdown = "[a](/projects) [b](https://example.com/x.md) [c](#local) [d](missing.md) [e](../../../outside.md)"
    const html = await render(markdown, "AI/post")
    for (const href of ["/projects", "https://example.com/x.md", "#local", "missing.md", "../../../outside.md"]) {
      expect(html).toContain(`href="${href}"`)
    }
  })
})
