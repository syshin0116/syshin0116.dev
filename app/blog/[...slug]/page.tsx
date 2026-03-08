import { notFound, redirect } from "next/navigation"
import { renderMarkdown, getAllMarkdownFiles, buildBacklinkIndex, getBacklinks } from "nuartz"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/blog/breadcrumb"
import { TableOfContents } from "@/components/blog/toc"
import { Backlinks } from "@/components/blog/backlinks"
import { MermaidRenderer } from "@/components/blog/mermaid-renderer"
import { GraphView } from "@/components/blog/graph-view"
import { HeadingAnchors } from "@/components/blog/heading-anchors"
import { PopoverPreview } from "@/components/blog/popover-preview"
import { CopyCode } from "@/components/blog/copy-code"
import { CONTENT_DIR } from "@/lib/content"

function readingTime(raw: string): number {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "")
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

async function getMarkdownFile(slug: string[]): Promise<string | null> {
  // Decode URL-encoded slug parts (handles Korean characters, etc.)
  const decodedSlug = slug.map(s => decodeURIComponent(s))
  const filePath = path.join(CONTENT_DIR, ...decodedSlug) + ".md"
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch {
    return null
  }
}

async function getAllSlugs(): Promise<string[][]> {
  async function walk(dir: string, base: string[] = []): Promise<string[][]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const results: string[][] = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        results.push(...(await walk(path.join(dir, entry.name), [...base, entry.name])))
      } else if (entry.name.endsWith(".md")) {
        results.push([...base, entry.name.replace(/\.md$/, "")])
      }
    }
    return results
  }
  try {
    return await walk(CONTENT_DIR)
  } catch {
    return []
  }
}

async function getFolderFiles(slug: string[]) {
  // Decode URL-encoded slug parts (handles Korean characters, etc.)
  const decodedSlug = slug.map(s => decodeURIComponent(s))
  const folderPath = path.join(CONTENT_DIR, ...decodedSlug)
  try {
    const stat = await fs.stat(folderPath)
    if (!stat.isDirectory()) return null
  } catch {
    return null
  }
  const allFiles = await getAllMarkdownFiles(CONTENT_DIR)
  const prefix = decodedSlug.join("/") + "/"
  return allFiles
    .filter((f) => f.slug.startsWith(prefix))
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0
      return db - da
    })
}

async function findByAlias(slug: string[]): Promise<string | null> {
  const aliasSlug = slug.join("/")
  const allFiles = await getAllMarkdownFiles(CONTENT_DIR)
  for (const file of allFiles) {
    const aliases: string[] = file.frontmatter.aliases ?? []
    if (aliases.some((a) => a === aliasSlug || a === `/${aliasSlug}`)) {
      return file.slug
    }
  }
  return null
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs()

  const folderPaths = new Set<string>()
  for (const slug of slugs) {
    for (let i = 1; i < slug.length; i++) {
      folderPaths.add(slug.slice(0, i).join("/"))
    }
  }
  const folderParams = [...folderPaths].map((p) => ({ slug: p.split("/") }))

  const aliasParams: { slug: string[] }[] = []
  try {
    const allFiles = await getAllMarkdownFiles(CONTENT_DIR)
    for (const file of allFiles) {
      const aliases: string[] = file.frontmatter.aliases ?? []
      for (const alias of aliases) {
        const cleaned = alias.startsWith("/") ? alias.slice(1) : alias
        if (cleaned) aliasParams.push({ slug: cleaned.split("/") })
      }
    }
  } catch {
    // ignore
  }

  return [...slugs.map((slug) => ({ slug })), ...folderParams, ...aliasParams]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const raw = await getMarkdownFile(slug)
  if (!raw) return {}
  const { data } = matter(raw)
  const title = data.title ?? slug[slug.length - 1]
  const description = data.description ?? ""
  const slugStr = slug.join("/")
  return {
    title: `${title} | Syshin's Blog`,
    description,
    alternates: {
      canonical: `/blog/${slugStr}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/blog/${slugStr}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const raw = await getMarkdownFile(slug)

  // Check if it's a folder
  if (!raw) {
    const folderFiles = await getFolderFiles(slug)
    if (folderFiles) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{slug[slug.length - 1]}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{folderFiles.length} notes</p>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-2">
            {folderFiles.map((file) => {
              const title = file.frontmatter.title ?? file.slug.split("/").pop()
              const date = file.frontmatter.date
                ? new Date(file.frontmatter.date).toLocaleDateString("en-CA")
                : null
              const tags: string[] = file.frontmatter.tags ?? []
              return (
                <Link key={file.slug} href={`/blog/${file.slug}`} className="group block">
                  <div className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium group-hover:underline underline-offset-4">{title}</span>
                      {date && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{date}</span>}
                    </div>
                    {file.frontmatter.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{file.frontmatter.description}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.from(new Set(tags)).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs font-normal">#{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )
    }

    // Check aliases
    const canonicalSlug = await findByAlias(slug)
    if (canonicalSlug) {
      redirect(`/blog/${canonicalSlug}`)
    }
    notFound()
  }

  // Filter out draft pages
  const { data: rawFrontmatter } = matter(raw)
  if (rawFrontmatter.draft === true || rawFrontmatter.published === false) {
    notFound()
  }

  const files = await getAllMarkdownFiles(CONTENT_DIR)

  // Build filename → full slug lookup for Obsidian-style wikilink resolution
  const slugByName = new Map<string, string>()
  for (const f of files) {
    const name = f.slug.split("/").pop()!.toLowerCase().replace(/\s+/g, "-")
    if (!slugByName.has(name)) slugByName.set(name, f.slug)
  }
  const resolveLink = (target: string): string => {
    const normalized = target.toLowerCase().replace(/\s+/g, "-").replace(/[^\w/-]/g, "")
    const exact = files.find((f) => f.slug === normalized)
    if (exact) return `/blog/${exact.slug}`
    const byName = slugByName.get(normalized.split("/").pop()!)
    if (byName) return `/blog/${byName}`
    return `/blog/${normalized}`
  }

  const knownSlugs = new Set(files.map((f) => f.slug))
  const rawResult = await renderMarkdown(raw, { resolveLink, knownSlugs })

  // Fix relative image paths: convert /api/content/image.png to /blog/api/content/slug/image.png
  const fileDir = slug.slice(0, -1).join('/')
  let html = rawResult.html.replaceAll('/api/content/', '/blog/api/content/')

  // Handle relative image paths in the current directory
  html = html.replace(
    /\/blog\/api\/content\/([^\/]+\.(png|jpg|jpeg|gif|webp|svg|mp4|pdf))/gi,
    (match, filename) => {
      // If the path already looks like it has directory structure, leave it
      if (filename.includes('/')) return match
      // Otherwise, prepend the current file's directory
      return `/blog/api/content/${fileDir}/${filename}`
    }
  )

  const result = {
    ...rawResult,
    html,
  }

  // Build backlink index
  const slugStr = slug.join("/")
  const pages = new Map<string, { result: Awaited<ReturnType<typeof renderMarkdown>>; raw: string }>()
  await Promise.all(
    files.map(async (file) => {
      const r = file.slug === slugStr ? result : await renderMarkdown(file.raw, { resolveLink })
      pages.set(file.slug, { result: r, raw: file.raw })
    })
  )
  const backlinkIndex = buildBacklinkIndex(pages)
  const backlinks = getBacklinks(backlinkIndex, slugStr)

  const date = result.frontmatter.date
    ? new Date(result.frontmatter.date).toLocaleDateString("en-CA")
    : null

  const filePath = path.join(CONTENT_DIR, ...slug) + ".md"
  const fileStat = await fs.stat(filePath)
  const modifiedDate = fileStat.mtime.toLocaleDateString("en-CA")

  return (
    <div className="flex min-h-0 gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {slug.length > 1 && (
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
        )}

        <header className="mb-6">
          {result.frontmatter.title && (
            <h1 className="text-3xl font-bold tracking-tight">{result.frontmatter.title}</h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {date && (
              <span className="text-sm text-muted-foreground tabular-nums">{date}</span>
            )}
            {modifiedDate && modifiedDate !== date && (
              <span className="text-sm text-muted-foreground">Updated {modifiedDate}</span>
            )}
            {readingTime(raw) >= 1 && (
              <span className="text-sm text-muted-foreground">{readingTime(raw)} min read</span>
            )}
            {date && result.tags.length > 0 && (
              <span className="text-muted-foreground">·</span>
            )}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(result.tags)).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal hover:bg-muted">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {result.frontmatter.description && (
            <p className="mt-3 text-base text-muted-foreground">{result.frontmatter.description}</p>
          )}
        </header>

        <Separator className="mb-8" />

        <HeadingAnchors />
        <PopoverPreview />
        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
        <MermaidRenderer />
        <CopyCode />

        <Backlinks backlinks={backlinks} />
      </div>

      {/* Right sidebar */}
      <TableOfContents toc={result.toc}>
        <GraphView currentSlug={slugStr} />
      </TableOfContents>
    </div>
  )
}
