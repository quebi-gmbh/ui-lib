/**
 * Stage: the watermark is decorative, and two stages never share a mask.
 *
 * The glyph is drawn by an SVG mask referenced by id; a fixed id would make the
 * second stage on a page resolve the first one's mask, and a React id used raw
 * contains characters a CSS `url(#…)` reference does not accept.
 */
import { expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { Stage } from "../../src/components/stage"

test("the glyph is hidden from assistive tech", () => {
  const { container } = render(<Stage>content</Stage>)
  const glyph = container.querySelector("[data-slot=stage-glyph]")
  expect(glyph?.getAttribute("aria-hidden")).toBe("true")
})

test("glyph={false} removes it", () => {
  const { container } = render(<Stage glyph={false}>content</Stage>)
  expect(container.querySelector("[data-slot=stage-glyph]")).toBeNull()
})

test("two stages get two mask ids, each safe in url() and each referenced by its own circle", () => {
  const { container } = render(
    <>
      <Stage>one</Stage>
      <Stage variant="gallery">two</Stage>
    </>,
  )
  const masks = Array.from(container.querySelectorAll("mask")).map((m) => m.id)
  expect(masks).toHaveLength(2)
  expect(new Set(masks).size).toBe(2)
  for (const id of masks) expect(id).toMatch(/^[\w-]+$/)
  const refs = Array.from(container.querySelectorAll("circle[mask]")).map((c) => c.getAttribute("mask"))
  expect(refs).toEqual(masks.map((id) => `url(#${id})`))
})
