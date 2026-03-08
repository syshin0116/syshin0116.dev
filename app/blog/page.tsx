import { getAllMarkdownFiles } from "nuartz"
import type { MarkdownFile } from "nuartz"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"
import { CONTENT_DIR } from "@/lib/content"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Blog | Syshin's Portfolio",
  description: "AI, 개발, 프로젝트에 관한 기술 블로그",
}

export default async function BlogPage() {
  let files: MarkdownFile[] = []
  try {
    files = await getAllMarkdownFiles(CONTENT_DIR)
  } catch {
    files = []
  }

  const published = files
    .filter((f) => !f.frontmatter.draft && f.frontmatter.published !== false)
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0
      return db - da
    })

  // Group by top-level folder
  const groups = new Map<string, MarkdownFile[]>()
  for (const file of published) {
    const topDir = file.slug.includes("/") ? file.slug.split("/")[0] : "Notes"
    if (!groups.has(topDir)) groups.set(topDir, [])
    groups.get(topDir)!.push(file)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">All Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{published.length} notes</p>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-10">
        {[...groups.entries()].map(([category, categoryFiles]) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h2>
              <span className="text-xs text-muted-foreground/60">({categoryFiles.length})</span>
            </div>
            <div className="space-y-2">
              {categoryFiles.map((file) => {
                const title = file.frontmatter.title ?? file.slug.split("/").pop()
                const date = file.frontmatter.date
                  ? new Date(file.frontmatter.date).toLocaleDateString("en-CA")
                  : null
                const tags: string[] = file.frontmatter.tags ?? []

                return (
                  <Link key={file.slug} href={`/blog/${file.slug}`} className="group block">
                    <div className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-medium group-hover:underline underline-offset-4">
                          {title}
                        </span>
                        {date && (
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {date}
                          </span>
                        )}
                      </div>
                      {file.frontmatter.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {file.frontmatter.description}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {[...new Set(tags)].map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs font-normal">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {published.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No notes found.
        </div>
      )}
    </div>
  )
}
