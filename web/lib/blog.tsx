import { blogPath } from "@/lib/blog-permalinks"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import notesList from "@/.generated/notes-list.json"

export const NOTES_PER_PAGE = 10

export interface NoteEntry {
  slug: string
  title: string
  description: string | null
  summary: string | null
  date: string | null
  dateRaw: string | null
  tags: string[]
  draft: boolean
  category: string | null
}

export function getPublishedNotes(): NoteEntry[] {
  return notesList as NoteEntry[]
}

export function filterNotes(notes: NoteEntry[], tag: string, sort: string) {
  return notes.filter(note => !tag || note.tags.includes(tag)).sort((a, b) =>
    (sort === "title" ? a.title.localeCompare(b.title, "ko") : (b.dateRaw ?? "").localeCompare(a.dateRaw ?? "")) || a.slug.localeCompare(b.slug, "en"))
}

function blogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`
}

export function BlogList({
  notes,
  currentPage,
  totalPages,
  totalCount,
  controls,
  pageHref = blogPageHref,
}: {
  notes: NoteEntry[]
  currentPage: number
  totalPages: number
  totalCount: number
  controls?: React.ReactNode
  pageHref?: (page: number) => string
}): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">전체 글</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalCount}개 글
        </p>
      </div>

      {controls}
      <Separator />

      <NoteList notes={notes} />

      {totalCount === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          조건에 맞는 글이 없습니다.
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <BlogPagination currentPage={currentPage} totalPages={totalPages} pageHref={pageHref} />
        </div>
      )}
    </div>
  )
}

type NotePreview = Pick<NoteEntry, "slug" | "title" | "description" | "date"> & Partial<Pick<NoteEntry, "tags" | "category">>

export function NoteList({ notes }: { notes: NotePreview[] }) {
  return (
    <ul aria-label="글 목록" className="divide-y divide-border/60">
      {notes.map(note => {
        const tags = [...new Set(note.tags ?? [])]
          .filter(tag => tag.toLowerCase() !== note.category?.toLowerCase())
          .slice(0, 3)
        return (
          <li key={note.slug}>
            <Link href={blogPath(note.slug)} className="group block rounded-sm py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <h2 className="text-base font-medium leading-7 group-hover:underline underline-offset-4">{note.title}</h2>
                {note.date && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{note.date}</span>}
              </div>
              {note.description && <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{note.description}</p>}
              {(note.category || tags.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-muted-foreground">
                  {note.category && <span>{note.category}</span>}
                  {tags.map(tag => <span key={tag}>#{tag}</span>)}
                </div>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function BlogPagination({
  currentPage,
  totalPages,
  pageHref,
}: {
  currentPage: number
  totalPages: number
  pageHref: (page: number) => string
}): React.ReactElement {
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? pageHref(currentPage - 1) : "#"}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pageNumbers.map((page, i) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={pageHref(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? pageHref(currentPage + 1) : "#"}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function getPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) {
    pages.push("ellipsis")
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push("ellipsis")
  }

  pages.push(total)

  return pages
}
