import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { NoteList } from "./blog"

test("note previews keep titles and links while limiting tags and omitting the category duplicate", () => {
  const html = renderToStaticMarkup(<NoteList notes={[
    { slug: "AI/example", title: "긴 글 제목도 유지", description: "본문 설명", date: "2026-09-09", category: "AI", tags: ["ai", "retrieval", "retrieval", "agents", "evaluation", "extra"] },
    { slug: "Dev/untagged", title: "태그 없는 글", description: null, date: null },
  ]} />)
  for (const text of ["긴 글 제목도 유지", "본문 설명", "태그 없는 글", 'href="/blog/AI/example"', 'href="/blog/Dev/untagged"', "#retrieval", "#agents", "#evaluation"]) {
    expect(html).toContain(text)
  }
  expect(html).not.toContain("#ai")
  expect(html).not.toContain("#extra")
  expect(html.match(/#retrieval/g)).toHaveLength(1)
})
