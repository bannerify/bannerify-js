import { describe, expect, test } from "bun:test"
import { validateImageFormat } from "./format"

describe("validateImageFormat", () => {
  test("defaults to png", () => {
    expect(validateImageFormat()).toEqual({ ok: true, format: "png" })
  })

  test("rejects unsupported format with error message", () => {
    const result = validateImageFormat("gif")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain("gif")
    }
  })
})
