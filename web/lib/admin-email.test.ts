import { describe, expect, test } from "bun:test"
import { isAdminEmail } from "./admin-email"

describe("isAdminEmail", () => {
  test("matches the explicit admin list case-insensitively", () => {
    expect(isAdminEmail("Owner@Example.com", "owner@example.com")).toBe(true)
  })

  test("fails closed when the admin list is empty", () => {
    expect(isAdminEmail("owner@example.com", "")).toBe(false)
    expect(isAdminEmail(null, "owner@example.com")).toBe(false)
  })
})
