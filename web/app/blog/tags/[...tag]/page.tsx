import type { Metadata } from "next"
import { NoteList } from "@/lib/blog"
import { notFound } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import tagsData from "@/.generated/tags.json"

interface TagEntry {
  slug: string
  title: string
  description: string | null
  date: string | null
}

const tagIndex = tagsData as Record<string, TagEntry[]>

export const revalidate = false
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(tagIndex).map((tag) => ({ tag: tag.split("/") }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string[] }>
}): Promise<Metadata> {
  const { tag } = await params
  const tagName = tag.join("/")
  if (!tagIndex[tagName]) return {}

  return {
    title: `#${tagName} | Syshin's Blog`,
    description: `Posts tagged ${tagName}`,
    robots: { index: false, follow: true },
  }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string[] }>
}) {
  const { tag } = await params
  const tagName = tag.join("/")
  const entries = tagIndex[tagName]
  if (!entries) notFound()

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">#{tagName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entries.length}개 글
        </p>
      </div>

      <Separator />

      <NoteList notes={entries} />
    </div>
  )
}
