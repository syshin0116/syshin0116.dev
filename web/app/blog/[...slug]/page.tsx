import { NoteList } from "@/lib/blog"
import { notFound } from "next/navigation"
import fs from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/blog/breadcrumb"
import { TableOfContents } from "@/components/blog/toc"
import { Backlinks } from "@/components/blog/backlinks"
import { MermaidRendererDynamic } from "@/components/blog/mermaid-renderer-dynamic"
import { GraphViewDynamic } from "@/components/blog/graph-view-dynamic"
import { HeadingAnchors } from "@/components/blog/heading-anchors"
import { PopoverPreview } from "@/components/blog/popover-preview"
import { CopyCode } from "@/components/blog/copy-code"
import { ImageZoom } from "@/components/blog/image-zoom"
import { GiscusComments } from "@/components/blog/giscus-comments"
import allSlugsData from "@/.generated/all-slugs.json"
import { tagPath } from "@/lib/tag"

export const revalidate = false

const GENERATED_DIR = path.join(process.cwd(), ".generated")

async function loadPageData(slugStr: string) {
  try {
    const raw = await fs.readFile(
      path.join(GENERATED_DIR, "pages", `${slugStr}.json`),
      "utf-8"
    )
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function loadFolderData(slugStr: string) {
  try {
    const raw = await fs.readFile(
      path.join(GENERATED_DIR, "folders", `${slugStr}.json`),
      "utf-8"
    )
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function generateStaticParams() {
  const data = allSlugsData as {
    pages: string[][]
    folders: string[][]
    aliases: string[][]
  }
  return [
    ...data.pages.map((slug) => ({ slug })),
    ...data.folders.map((slug) => ({ slug })),
    ...data.aliases.map((slug) => ({ slug })),
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const slugStr = slug.map(s => decodeURIComponent(s)).join("/")
  const pageData = await loadPageData(slugStr)

  if (!pageData) {
    // Folder listing pages
    const folderData = await loadFolderData(slugStr)
    if (folderData) {
      return {
        title: `${slug[slug.length - 1]} | Syshin's Blog`,
        robots: { index: false, follow: true },
      }
    }
    return {}
  }

  const title = pageData.frontmatter.title ?? slug[slug.length - 1]
  const description = pageData.frontmatter.description ?? ""
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
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug: encodedSlug } = await params
  const slug = encodedSlug.map((s) => decodeURIComponent(s))
  const slugStr = slug.join("/")

  const pageData = await loadPageData(slugStr)

  // Check if it's a folder
  if (!pageData) {
    const folderData = await loadFolderData(slugStr)
    if (folderData) {
      return (
        <div className="mx-auto max-w-3xl w-full px-6 py-10">
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {slug[slug.length - 1]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {folderData.files.length}개 글
            </p>
          </div>
          <Separator />
          <NoteList notes={folderData.files} />
        </div>
      )
    }

    // Alias redirects are handled via generateStaticParams — if the page wasn't found,
    // it's a true 404
    notFound()
  }

  // Filter out draft pages
  if (
    pageData.frontmatter.draft === true ||
    pageData.frontmatter.published === false
  ) {
    notFound()
  }

  const { html, frontmatter, toc, tags, backlinks, prevNext, readingTime: rt, date, modifiedDate } = pageData

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title ?? slugStr,
    datePublished: date,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: "Syshin",
      url: "https://syshin0116.vercel.app",
    },
    url: `https://syshin0116.vercel.app/blog/${slugStr}`,
  }

  return (
    <div className="flex min-h-0 gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Main content */}
      <div className="reading-column min-w-0 flex-1">
        {slug.length > 1 && (
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
        )}

        <header className="mb-6">
          {frontmatter.title && (
            <h1 className="text-3xl font-bold tracking-tight">
              {frontmatter.title}
            </h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {date && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {date}
              </span>
            )}
            {modifiedDate && modifiedDate !== date && (
              <span className="text-sm text-muted-foreground">
                수정 {modifiedDate}
              </span>
            )}
            {rt >= 1 && (
              <span className="text-sm text-muted-foreground">
                읽는 시간 {rt}분
              </span>
            )}
          </div>
        </header>

        <Separator className="mb-6" />

        {frontmatter.summary && (
          <section aria-label="요약" className="mb-6 text-sm leading-7 text-muted-foreground">
            <p>{frontmatter.summary as string}</p>
          </section>
        )}

        <HeadingAnchors />
        <PopoverPreview />
        <TableOfContents toc={toc} mobile>
          <GraphViewDynamic currentSlug={slugStr} />
        </TableOfContents>

        <article
          data-pagefind-body
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <MermaidRendererDynamic />
        <CopyCode />
        <ImageZoom />

        {tags.length > 0 && (
          <nav aria-label="글 태그" className="mt-8 flex flex-wrap gap-1.5">
            {Array.from(new Set(tags as string[])).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tags/${tagPath(tag)}`}
              >
                <Badge
                  variant="secondary"
                  className="text-xs font-normal hover:bg-muted"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </nav>
        )}

        <Backlinks backlinks={backlinks} />

        <PrevNextNav prevNext={prevNext} />

        <GiscusComments />
      </div>

      {/* Right sidebar */}
      <TableOfContents toc={toc}>
        <GraphViewDynamic currentSlug={slugStr} />
      </TableOfContents>
    </div>
  )
}

function PrevNextNav({
  prevNext,
}: {
  prevNext: {
    prev: { slug: string; title: string } | null
    next: { slug: string; title: string } | null
  }
}) {
  const { prev, next } = prevNext

  if (!prev && !next) return null

  return (
    <nav
      aria-label="이전 및 다음 글"
      className="mt-12 flex items-stretch gap-4 border-t pt-6"
    >
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="truncate text-sm font-medium group-hover:underline">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex min-w-0 flex-1 items-center justify-end gap-2 rounded-lg border px-4 py-3 text-right transition-colors hover:bg-muted/50"
        >
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="truncate text-sm font-medium group-hover:underline">
              {next.title}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  )
}
