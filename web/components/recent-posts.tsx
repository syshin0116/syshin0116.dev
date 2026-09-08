import Link from "next/link";
import { ArrowRight } from "lucide-react";
import notesList from "@/.generated/notes-list.json";
import type { NoteEntry } from "@/lib/blog";

function formatDate(date: string | undefined | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export function RecentPosts() {
  const posts = (notesList as NoteEntry[]).slice(0, 3);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold">최근 글</h2>
        <Link
          href="/blog"
          aria-label="최근 블로그 포스트 전체 보기"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          전체 보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <ul className="divide-y divide-border/60">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="group block rounded-sm py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(post.dateRaw ?? post.date)}
                </p>
                <h3 className="font-medium text-sm leading-6 group-hover:underline underline-offset-4 line-clamp-2">
                  {post.title}
                </h3>
              </div>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="text-sm text-muted-foreground">게시물이 없습니다.</li>
        )}
      </ul>
    </section>
  );
}
