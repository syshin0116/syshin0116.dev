import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { routeCachePagePath } from "./build-search-index"

describe("routeCachePagePath", () => {
  const root = join("/web", ".next", "server", "route-cache")

  test("maps an adapter route-cache file back to its app page path", () => {
    expect(routeCachePagePath(join(root, "APP_PAGE", "ab12", "$", "blog", "AI", "post.html"), root))
      .toBe("blog/AI/post.html")
    expect(routeCachePagePath(join(root, "APP_PAGE", "ab12", "$", "index.html"), root)).toBe("index.html")
  })

  test("rejects files outside the <kind>/<hash>/$ layout", () => {
    expect(routeCachePagePath(join(root, "APP_PAGE", "ab12", "post.html"), root)).toBeUndefined()
  })
})
