/** Eyebrow: the caps are CSS, so the text a reader or a copy gets is what was written. */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Eyebrow } from "../../src/components/eyebrow"

test("renders a p by default and keeps the source text lowercase", () => {
  render(<Eyebrow>scene 01 — the studio</Eyebrow>)
  const el = screen.getByText("scene 01 — the studio")
  expect(el.tagName).toBe("P")
  expect(el.className).toContain("quebi-eyebrow")
})

test("as='span' renders inline", () => {
  render(<Eyebrow as="span">04 entries</Eyebrow>)
  expect(screen.getByText("04 entries").tagName).toBe("SPAN")
})
