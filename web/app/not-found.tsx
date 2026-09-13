import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-2xl flex-col justify-center gap-6 px-4 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-muted-foreground">
          주소가 바뀌었거나 삭제된 글일 수 있습니다. 아래에서 다시 찾아보세요.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/blog"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          블로그 글 목록
        </Link>
        <Link
          href="/"
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          홈으로
        </Link>
      </div>
    </main>
  )
}
