import { expect, test } from "bun:test"
import { messageFits } from "./use-message-queue"

test("accepts bounded batches and rejects combined UTF-8 and code-unit overflow", () => {
  expect(messageFits("a".repeat(8_000))).toBe(true)
  expect(messageFits("a".repeat(8_001))).toBe(false)
  expect(messageFits("한".repeat(5_333))).toBe(true)
  expect(messageFits("한".repeat(5_334))).toBe(false)
  expect(messageFits(["한".repeat(3_000), "글".repeat(3_000)].join("\n\n"))).toBe(false)
  expect(messageFits("😀".repeat(4_000))).toBe(true)
  expect(messageFits(["😀".repeat(2_000), "😀".repeat(2_000)].join("\n\n"))).toBe(false)
})
