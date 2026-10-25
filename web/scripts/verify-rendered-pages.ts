import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { join, normalize, relative, resolve, sep } from "node:path"
import { permalinks } from "@/lib/blog-permalinks"
import { CONTENT_DIR } from "@/lib/content"
import { mediaTypeForPath } from "@/lib/media"
import { pageDescription } from "@/lib/page-description"
import { projectsDetail } from "@/data/projects"

// Checks the prebuild output instead of crawling a server: crawling `next start`
// concurrently produced spurious 404s, and a sequential crawl of every page takes
// minutes. Each rule below mirrors the route that would answer the URL.

export type RenderedPage = {
  slug: string
  html: string
  frontmatter: Record<string, unknown>
}

export type SiteIndex = {
  pageSlugs: Set<string>
  folderSlugs: Set<string>
  tags: Set<string>
  publicFiles: Set<string>
  contentFileExists: (contentPath: string) => boolean
}

// Pages that are indexes rather than articles, so they have no paragraph to
// describe them.
export const DESCRIPTION_EXEMPT = new Set(["wiki/index", "wiki/log"])

const STATIC_ROUTES = new Set(["/", "/about", "/blog", "/projects", "/login", "/feed.xml", "/robots.txt"])
const LINK_ATTRIBUTE = /<(a|img|source|video|audio|iframe)\b[^>]*?\s(href|src)="([^"]*)"/gi
const SCHEME = /^[a-z][a-z0-9+.-]*:/i

function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function decodePath(pathname: string): string | undefined {
  try {
    return pathname.split("/").map(segment => decodeURIComponent(segment)).join("/")
  } catch {
    return undefined
  }
}

/** Why the internal URL would not resolve, or undefined when it would. */
export function unresolvedReason(url: string, site: SiteIndex): string | undefined {
  if (url === "") return "empty link target"
  if (url.startsWith("#") || url.startsWith("//") || SCHEME.test(url)) return undefined
  if (!url.startsWith("/")) return "relative URL resolves against the page path"

  const pathname = decodePath(new URL(url, "https://site.invalid").pathname)
  if (pathname === undefined) return "malformed percent-encoding"
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname

  if (STATIC_ROUTES.has(trimmed)) return undefined
  if (/^\/blog\/page\/\d+$/.test(trimmed)) return undefined
  if (trimmed.startsWith("/projects/")) {
    return Object.hasOwn(projectsDetail, trimmed.slice("/projects/".length)) ? undefined : "unknown project"
  }
  if (trimmed.startsWith("/blog/tags/")) {
    return site.tags.has(trimmed.slice("/blog/tags/".length)) ? undefined : "unknown tag"
  }
  if (trimmed.startsWith("/blog/api/content/")) {
    const contentPath = normalize(trimmed.slice("/blog/api/content/".length))
    if (contentPath === "." || contentPath.startsWith("..")) return "content path escapes the content root"
    if (!mediaTypeForPath(contentPath)) return "content route does not serve this file type"
    return site.contentFileExists(contentPath) ? undefined : "content file does not exist"
  }
  if (trimmed.startsWith("/blog/")) {
    const slug = permalinks.sourceSlug(trimmed.slice("/blog/".length))
    return site.pageSlugs.has(slug) || site.folderSlugs.has(slug) ? undefined : "no published page or folder"
  }
  return site.publicFiles.has(trimmed) ? undefined : "no route or public file"
}

export function brokenLinks(page: RenderedPage, site: SiteIndex): string[] {
  const problems: string[] = []
  for (const match of page.html.matchAll(LINK_ATTRIBUTE)) {
    const url = decodeEntities(match[3])
    const reason = unresolvedReason(url, site)
    if (reason) problems.push(`${page.slug}: ${match[1].toLowerCase()} ${match[2]}="${url}" (${reason})`)
  }
  return problems
}

export function missingDescription(page: RenderedPage): string | undefined {
  if (DESCRIPTION_EXEMPT.has(page.slug)) return undefined
  return pageDescription(page.frontmatter, page.html) ? undefined : `${page.slug}: no description, summary, or paragraph`
}

function isPublished(frontmatter: Record<string, unknown>): boolean {
  return frontmatter.draft !== true && frontmatter.published !== false
}

async function jsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
    .map(entry => join(entry.parentPath, entry.name))
}

async function main(): Promise<number> {
  const webRoot = resolve(import.meta.dir, "..")
  const generated = join(webRoot, ".generated")
  const publicDir = join(webRoot, "public")
  const contentRoot = resolve(webRoot, CONTENT_DIR)

  const pages: RenderedPage[] = []
  for (const file of await jsonFiles(join(generated, "pages"))) {
    const data = JSON.parse(await readFile(file, "utf-8"))
    const slug = relative(join(generated, "pages"), file).split(sep).join("/").replace(/\.json$/, "")
    if (isPublished(data.frontmatter ?? {})) pages.push({ slug, html: data.html ?? "", frontmatter: data.frontmatter ?? {} })
  }
  const allSlugs = JSON.parse(await readFile(join(generated, "all-slugs.json"), "utf-8")) as { folders: string[][] }
  const tags = JSON.parse(await readFile(join(generated, "tags.json"), "utf-8")) as Record<string, unknown>
  const publicEntries = await readdir(publicDir, { recursive: true, withFileTypes: true })

  const site: SiteIndex = {
    pageSlugs: new Set(pages.map(page => page.slug)),
    folderSlugs: new Set(allSlugs.folders.map(segments => segments.join("/"))),
    tags: new Set(Object.keys(tags)),
    publicFiles: new Set(
      publicEntries.filter(entry => entry.isFile()).map(entry => `/${relative(publicDir, join(entry.parentPath, entry.name)).split(sep).join("/")}`),
    ),
    contentFileExists: contentPath => existsSync(join(contentRoot, contentPath)),
  }

  const problems = pages.flatMap(page => [...brokenLinks(page, site), missingDescription(page)].filter((item): item is string => Boolean(item)))
  for (const problem of problems) console.error(problem)
  console.log(`verify-rendered-pages: ${pages.length} pages, ${problems.length} problems`)
  return problems.length === 0 ? 0 : 1
}

if (import.meta.main) process.exit(await main())
