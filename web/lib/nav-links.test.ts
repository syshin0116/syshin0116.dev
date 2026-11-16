import { describe, expect, test } from "bun:test"
import { activeNavHref } from "./nav-links"

describe("activeNavHref", () => {
  test("marks the most specific section", () => {
    expect(activeNavHref("/blog/wiki")).toBe("/blog/wiki")
    expect(activeNavHref("/blog/wiki/docker")).toBe("/blog/wiki")
    expect(activeNavHref("/blog/some-post")).toBe("/blog")
    expect(activeNavHref("/blog")).toBe("/blog")
  })

  test("matches whole path segments only", () => {
    expect(activeNavHref("/blog/wikipedia-notes")).toBe("/blog")
    expect(activeNavHref("/projectsx")).toBeUndefined()
  })

  test("home is active only on the root", () => {
    expect(activeNavHref("/")).toBe("/")
    expect(activeNavHref("/about")).toBe("/about")
  })
})
