import { blogPath, permalinks } from "@/lib/blog-permalinks"
import notesList from "@/.generated/notes-list.json"
import type { NoteEntry } from "@/lib/blog"
import { LEGACY_FEED_ORIGIN, SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

const BASE_URL = SITE_URL

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const posts = (notesList as NoteEntry[])
    .filter((f) => !f.draft)
    .slice(0, 50)

  const lastBuildDate = posts[0]?.dateRaw
    ? new Date(posts[0].dateRaw).toUTCString()
    : new Date().toUTCString()

  const items = posts
    .map((post) => {
      const title = escapeXml(String(post.title))
      const description = escapeXml(String(post.description ?? ""))
      const url = `${BASE_URL}${blogPath(post.slug)}`
      // Subscribers stored the pre-permalink path on the old origin. Both the
      // short address and the canonical domain are newer than that, so neither
      // may reach the guid.
      const guid = `${LEGACY_FEED_ORIGIN}${permalinks.originalPath(post.slug)}`
      const pubDate = post.dateRaw
        ? new Date(post.dateRaw).toUTCString()
        : ""
      const categories = (post.tags as string[])
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("")

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${guid}</guid>
      <description>${description}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${categories}
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Syshin0116 Dev Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>AI Research Engineer portfolio &amp; tech blog</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
