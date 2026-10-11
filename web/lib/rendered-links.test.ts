import { describe, expect, test } from "bun:test"
import { renderMarkdown } from "nuartz/markdown"
import { rewriteRenderedLinks, type RenderedLinkContext } from "./rendered-links"

const notes = new Map([
  ["ai/2026-05-18-tech-intelligence-radar", "AI/2026-05-18-Tech-Intelligence-Radar"],
  ["dev/2026-07-16-azure-b시리즈-cpu-크레딧", "Dev/2026-07-16-Azure B시리즈 CPU 크레딧"],
])
const media = new Set(["AI/assets/diagram.png"])

const context: RenderedLinkContext = {
  from: "wiki/radar",
  markdown: "",
  resolveNotePath: contentPath => notes.get(contentPath.toLowerCase().replace(/\s+/g, "-")),
  notePath: source => `/blog/${source.split("/").map(encodeURIComponent).join("/")}`,
  isPublishedMedia: contentPath => media.has(contentPath),
}

async function render(markdown: string, from = context.from) {
  const { html } = await renderMarkdown(markdown, {
    baseUrl: "/blog/",
    knownSlugs: new Set(["AI/known"]),
    resolveLink: target => `/blog/${target === "known" ? "AI/known" : target}`,
  })
  return rewriteRenderedLinks(html, { ...context, from, markdown })
}

describe("rewriteRenderedLinks", () => {
  test("inline tags link once under /blog/tags with each path segment encoded", async () => {
    const { html, inlineTags } = await render("본문 #RMSE 와 #nested/child 그리고 #adsp중요")
    expect(html).toContain('<a href="/blog/tags/RMSE" class="tag" data-tag="RMSE">#RMSE</a>')
    expect(html).toContain('href="/blog/tags/nested/child"')
    expect(html).toContain(`<a href="/blog/tags/adsp${encodeURIComponent("중요")}" class="tag" data-tag="adsp중요">#adsp중요</a>`)
    expect(html.match(/class="tag"/g)).toHaveLength(3)
    expect(inlineTags).toEqual(["RMSE", "nested/child", "adsp중요"])
  })

  test("a URL fragment stays inside its autolink and is not a tag", async () => {
    const url = "https://cloud.google.com/compute/docs/instances/ssh#third-party-tools"
    const { html, inlineTags } = await render(`${url}\n\nhttps://x.com/a#b/c 접속`)
    expect(html).toContain(`<a href="${url}">${url}</a>`)
    expect(html).toContain('<a href="https://x.com/a#b/c">https://x.com/a#b/c</a> 접속')
    expect(inlineTags).toEqual([])
  })

  test("a hash in link text stays in the link", async () => {
    const { html, inlineTags } = await render("[Spotify's Failed #SquadGoals (Jeremiah Lee)](https://example.com/a)")
    expect(html).toBe('<p><a href="https://example.com/a">Spotify\'s Failed #SquadGoals (Jeremiah Lee)</a></p>')
    expect(inlineTags).toEqual([])
  })

  test("a hash after punctuation is text even when the same tag appears elsewhere", async () => {
    const { html, inlineTags } = await render("Plan: #E1 작업\n\n변수(#E1, 등)")
    expect(html).toContain('Plan: <a href="/blog/tags/E1" class="tag" data-tag="E1">#E1</a> 작업')
    expect(html).toContain("변수(#E1, 등)")
    expect(inlineTags).toEqual(["E1"])
  })

  test("formatting after a hash in a link label stays inside the link", async () => {
    const { html } = await render("[foo #tag **bar** & baz](https://example.com)")
    expect(html).toBe('<p><a href="https://example.com">foo #tag <strong>bar</strong> &#x26; baz</a></p>')
  })

  test("a hash inside a multi-backtick code span does not shift later tags", async () => {
    const { inlineTags } = await render("``a#tag`` 다음 #tag")
    expect(inlineTags).toEqual(["tag"])
  })

  test("hashes in indented code and table cells keep later tags aligned", async () => {
    const { inlineTags } = await render("    value#tag\n\n| a | #cell |\n|---|---|\n| b#tag | c |\n\n다음 #tag")
    expect(inlineTags).toEqual(["cell", "tag"])
  })

  test("links sharing a destination each keep their whole label", async () => {
    const { html } = await render("[first #tag x](https://example.com) [second #tag xyz](https://example.com)")
    expect(html).toBe('<p><a href="https://example.com">first #tag x</a> <a href="https://example.com">second #tag xyz</a></p>')
  })

  test("footnote definitions are matched after the body, where they render", async () => {
    const { inlineTags } = await render("[^n]: value#tag\n\n본문 #tag[^n]")
    expect(inlineTags).toEqual(["tag"])
  })

  test("a hash right after a link that does not contain it stays outside the link", async () => {
    const { html } = await render("[foo](https://example.com)#bar")
    expect(html).toBe('<p><a href="https://example.com">foo</a>#bar</p>')
  })

  test("an escaped hash is text even when the same tag is real elsewhere", async () => {
    const { html, inlineTags } = await render("진짜 #python 태그와 이스케이프한 \\#python")
    expect(html).toBe('<p>진짜 <a href="/blog/tags/python" class="tag" data-tag="python">#python</a> 태그와 이스케이프한 #python</p>')
    expect(inlineTags).toEqual(["python"])
  })

  test("hashes inside code are not counted against later prose tags", async () => {
    const { inlineTags } = await render("```\nx = 1  # \\#skip\n```\n\n`a\\#python` 다음 #python")
    expect(inlineTags).toEqual(["python"])
  })

  test("escaped and mid-word hashes are text, as in Obsidian", async () => {
    const { html, inlineTags } = await render("인스타 \\#python 변수(#E1, C#")
    expect(html).toBe("<p>인스타 #python 변수(#E1, C#</p>")
    expect(inlineTags).toEqual([])
  })

  test("unresolved wikilinks render as text instead of a 404 link", async () => {
    const { html } = await render("[[Never Written|그 글]] and [[known]]")
    expect(html).toContain('<span class="wikilink broken" data-target="Never Written">그 글</span>')
    expect(html).toContain('<a href="/blog/AI/known" class="wikilink" data-target="known">known</a>')
  })

  test("relative .md links resolve to the note permalink and keep the anchor", async () => {
    const { html } = await render("[radar](../AI/2026-05-18-Tech-Intelligence-Radar.md#scoring)")
    expect(html).toContain('href="/blog/AI/2026-05-18-Tech-Intelligence-Radar#scoring"')
  })

  test("root-relative content paths without /blog resolve to the note", async () => {
    const { html } = await render("[지난 글](/Dev/2026-07-16-Azure-B시리즈-CPU-크레딧)", "Dev/later")
    expect(html).toContain(`href="/blog/Dev/2026-07-16-Azure%20B${encodeURIComponent("시리즈")}%20CPU%20${encodeURIComponent("크레딧")}"`)
  })

  test("relative links to published media go to the content API", async () => {
    const { html } = await render("![diagram](assets/diagram.png)", "AI/post")
    expect(html).toContain('src="/blog/api/content/AI/assets/diagram.png"')
  })

  test("media links keep their query and fragment", async () => {
    const { html } = await render("[diagram](assets/diagram.png#zoom)", "AI/post")
    expect(html).toContain('href="/blog/api/content/AI/assets/diagram.png#zoom"')
  })

  test("site routes, external URLs and unknown paths are left alone", async () => {
    const markdown = "[a](/projects) [b](https://example.com/x.md) [c](#local) [d](missing.md) [e](../../../outside.md)"
    const { html } = await render(markdown, "AI/post")
    for (const href of ["/projects", "https://example.com/x.md", "#local", "missing.md", "../../../outside.md"]) {
      expect(html).toContain(`href="${href}"`)
    }
  })
})
