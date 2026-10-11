import { describe, expect, test } from "bun:test"

import { pageDescription } from "./page-description"

describe("pageDescription", () => {
  test("prefers description, then summary", () => {
    expect(pageDescription({ description: "설명", summary: "요약" }, "<p>본문</p>")).toBe("설명")
    expect(pageDescription({ summary: "요약" }, "<p>본문</p>")).toBe("요약")
  })

  test("falls back to the first non-empty paragraph as plain text", () => {
    const html = '<p><img alt="" src="a.png"></p><p>첫 <strong>문단</strong> &amp; 끝</p><p>둘째</p>'
    expect(pageDescription({}, html)).toBe("첫 문단 & 끝")
  })

  test("shortens long paragraphs", () => {
    const text = "가".repeat(300)
    const result = pageDescription({}, `<p>${text}</p>`)
    expect(result.length).toBe(160)
    expect(result.endsWith("…")).toBe(true)
  })

  test("returns an empty string when there is no prose", () => {
    expect(pageDescription({ description: "  " }, "<pre>code</pre>")).toBe("")
  })
})
