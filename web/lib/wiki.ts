/**
 * Wiki layer views built at prebuild time from wiki page frontmatter:
 * which wiki pages cite each source post, and the hub grouped by maturity status.
 */

export const WIKI_FOLDER = "wiki"
export const WIKI_STATUSES = ["evergreen", "budding", "seedling"] as const
export type WikiStatus = (typeof WIKI_STATUSES)[number]

// Maintained by the wiki-curator skill, not knowledge pages.
const WIKI_INFRASTRUCTURE = new Set(["wiki/index", "wiki/log"])

export interface WikiNote {
  slug: string
  /** Repository-relative path, e.g. `content/Tools/post.md`. */
  sourcePath: string
  frontmatter: Record<string, unknown>
}

export interface WikiCitation {
  slug: string
  title: string
  summary: string | null
}

export interface WikiHubPage extends WikiCitation {
  sourceCount: number
}

export interface WikiHubGroup {
  status: WikiStatus | null
  pages: WikiHubPage[]
}

function isPublished(note: WikiNote) {
  return note.frontmatter.draft !== true && note.frontmatter.published !== false
}

function isWikiPage(note: WikiNote) {
  return note.slug.startsWith(`${WIKI_FOLDER}/`) && !WIKI_INFRASTRUCTURE.has(note.slug) && isPublished(note)
}

function titleOf(note: WikiNote) {
  const title = note.frontmatter.title
  return typeof title === "string" && title ? title : note.slug.split("/").pop() ?? note.slug
}

function summaryOf(note: WikiNote) {
  const summary = note.frontmatter.summary
  return typeof summary === "string" && summary ? summary : null
}

function sourcesOf(note: WikiNote): string[] {
  const sources = note.frontmatter.sources
  return Array.isArray(sources) ? sources.filter((source): source is string => typeof source === "string") : []
}

const byTitle = (a: WikiCitation, b: WikiCitation) => a.title.localeCompare(b.title, "ko")

/** Map each source post slug to the published wiki pages listing it in `sources:`. */
export function wikiCitationsBySource(notes: WikiNote[]): Map<string, WikiCitation[]> {
  const slugByPath = new Map(notes.map(note => [note.sourcePath.normalize("NFC"), note.slug]))
  const citations = new Map<string, WikiCitation[]>()
  for (const page of notes.filter(isWikiPage)) {
    const cited = new Set<string>()
    for (const source of sourcesOf(page)) {
      const target = slugByPath.get(source.split("#")[0].normalize("NFC"))
      if (!target || target.startsWith(`${WIKI_FOLDER}/`) || cited.has(target)) continue
      cited.add(target)
      const entries = citations.get(target) ?? []
      entries.push({ slug: page.slug, title: titleOf(page), summary: summaryOf(page) })
      citations.set(target, entries)
    }
  }
  for (const entries of citations.values()) entries.sort(byTitle)
  return citations
}

/** Group published wiki pages by status, most mature first; pages without a known status go last. */
export function wikiHub(notes: WikiNote[]): WikiHubGroup[] {
  const groups = new Map<WikiStatus | null, WikiHubPage[]>()
  for (const page of notes.filter(isWikiPage)) {
    const declared = page.frontmatter.status
    const status = WIKI_STATUSES.find(known => known === declared) ?? null
    const pages = groups.get(status) ?? []
    pages.push({ slug: page.slug, title: titleOf(page), summary: summaryOf(page), sourceCount: sourcesOf(page).length })
    groups.set(status, pages)
  }
  return [...WIKI_STATUSES, null]
    .filter(status => groups.has(status))
    .map(status => ({ status, pages: groups.get(status)!.sort(byTitle) }))
}
