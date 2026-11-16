import { blogPath } from "@/lib/blog-permalinks"
import type { WikiHubGroup, WikiStatus } from "@/lib/wiki"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const STATUS_COPY: Record<WikiStatus, { label: string; description: string }> = {
  evergreen: { label: "Evergreen", description: "사람이 출처와 대조해 확인한 안정된 페이지" },
  budding: { label: "Budding", description: "여러 출처를 엮어 자기 구조를 갖춘 페이지" },
  seedling: { label: "Seedling", description: "한두 개 출처에서 주장을 뽑아 시작한 페이지" },
}
const UNCLASSIFIED = { label: "미분류", description: "아직 상태를 정하지 않은 페이지" }

export function WikiHub({ groups }: { groups: WikiHubGroup[] }) {
  const total = groups.reduce((sum, group) => sum + group.pages.length, 0)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">위키</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground [word-break:keep-all]">
          블로그 글을 출처로 삼아 주제별로 정리한 지식 페이지 {total}개입니다. 페이지마다 근거가 된 글을 각주로 연결합니다.
        </p>
        <nav aria-label="위키 상태" className="mt-4 flex flex-wrap gap-2 text-xs">
          {groups.map(group => {
            const copy = group.status ? STATUS_COPY[group.status] : UNCLASSIFIED
            return (
              <a key={group.status ?? "unclassified"} href={`#${group.status ?? "unclassified"}`} className="rounded-full border px-3 py-1 hover:bg-muted">
                {copy.label} {group.pages.length}
              </a>
            )
          })}
        </nav>
      </header>
      <Separator />
      {groups.map(group => {
        const id = group.status ?? "unclassified"
        const copy = group.status ? STATUS_COPY[group.status] : UNCLASSIFIED
        return (
          <section key={id} id={id} aria-labelledby={`${id}-heading`} className="mt-8 scroll-mt-20">
            <h2 id={`${id}-heading`} className="text-lg font-semibold">
              {copy.label} <span className="text-sm font-normal text-muted-foreground">{group.pages.length}</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
            <ul className="mt-4 space-y-3">
              {group.pages.map(page => (
                <li key={page.slug}>
                  <Link href={blogPath(page.slug)} className="group block rounded-lg border p-4 transition-colors hover:bg-muted">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium group-hover:underline [word-break:keep-all]">{page.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">출처 {page.sourceCount}</span>
                    </div>
                    {page.summary && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground [word-break:keep-all] [overflow-wrap:break-word]">
                        {page.summary}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
