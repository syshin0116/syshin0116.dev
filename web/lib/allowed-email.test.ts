import { describe, expect, test } from "bun:test"
import { isAllowedEmail } from "./allowed-email"

describe("isAllowedEmail", () => {
  test("matches configured emails case-insensitively", () => {
    expect(isAllowedEmail("Owner@Example.com", "other@example.com, owner@example.com", "production")).toBe(true)
  })

  test("denies unlisted and missing emails", () => {
    expect(isAllowedEmail("guest@example.com", "owner@example.com", "production")).toBe(false)
    expect(isAllowedEmail(null, "owner@example.com", "production")).toBe(false)
  })

  test("fails closed in production when the list is empty", () => {
    expect(isAllowedEmail("owner@example.com", "", "production")).toBe(false)
    expect(isAllowedEmail("owner@example.com", " , ", "production")).toBe(false)
    expect(isAllowedEmail("owner@example.com", "", "development")).toBe(true)
  })
})
