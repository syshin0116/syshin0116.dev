import { expect, test } from "@playwright/test"

// Posts whose body links used to 404: unresolved wikilinks, `/tags/` hashtags, URL
// fragments read as tags, relative `.md` links, root-relative content paths, and
// wikilinks written as an undated filename or a title.
const POSTS = [
  "/blog/Dev/2024-12-25-DuckDB",
  "/blog/wiki/tech-intelligence-radar",
  "/blog/Dev/2026-08-20-CI 최적화, 626초에서 90초까지",
  "/blog/Dev/2024-09-23-GCP VSCODE SSH 연결 방법",
  "/blog/Dev/2025-05-08-CICD 툴 비교",
  "/blog/AI/2025-06-04-Agent Architecture Comparison",
  "/blog/Study/SeSAC/2023-08-29-SeSAC-혼공 머신러닝+딥러닝-정리",
]

test("post body links resolve to pages that exist", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "site-desktop", "server-rendered links do not depend on the viewport")
  test.setTimeout(120_000)

  for (const post of POSTS) {
    await page.goto(post)
    const article = page.locator("article.prose")
    await expect(article).toBeVisible()
    await expect(article.locator('a[href^="/tags/"], a.tag:empty, a.wikilink.broken')).toHaveCount(0)

    const origin = new URL(page.url()).origin
    const hrefs = await article.locator("a[href]").evaluateAll(anchors =>
      anchors.map(anchor => (anchor as HTMLAnchorElement).href))
    const internal = [...new Set(hrefs.map(href => new URL(href)).filter(url => url.origin === origin)
      .map(url => url.pathname))]
    for (const pathname of internal) {
      const response = await request.get(pathname)
      expect(response.status(), `${post} -> ${decodeURIComponent(pathname)}`).toBeLessThan(400)
    }
  }
})
