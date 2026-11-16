import { blogPath } from "@/lib/blog-permalinks"
import type { WikiCitation } from "@/lib/wiki"
import Link from "next/link"

export function WikiCitations({ citations }: { citations: WikiCitation[] }) {
  if (!citations.length) return null

  return (
    <section aria-labelledby="wiki-citations-heading" className="mt-12 border-t pt-8">
      <h2 id="wiki-citations-heading" className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        이 글을 인용한 위키 ({citations.length})
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">이 글을 근거로 정리한 위키 페이지입니다.</p>
      <ul className="space-y-3">
        {citations.map(citation => (
          <li key={citation.slug}>
            <Link
              href={blogPath(citation.slug)}
              className="group block rounded-lg border p-3 transition-colors hover:bg-muted"
            >
              <div className="text-sm font-medium group-hover:underline">{citation.title}</div>
              {citation.summary && (
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground [word-break:keep-all]">
                  {citation.summary}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
