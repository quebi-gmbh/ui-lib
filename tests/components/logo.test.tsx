/**
 * Logo: one accessible image, two decorative files.
 *
 * Both inks are always in the DOM (the theme picks one in CSS), so the
 * guarantee worth pinning is that assistive tech meets exactly one image named
 * "quebi", not two, and that the variant and the overrides pick the files.
 */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Logo } from "../../src/components/logo"

const files = (container: HTMLElement) => Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"))

test("is one image named quebi, with both files decorative", () => {
  const { container } = render(<Logo />)
  expect(screen.getAllByRole("img")).toHaveLength(1)
  expect(screen.getByRole("img", { name: "quebi" })).toBeInTheDocument()
  for (const img of Array.from(container.querySelectorAll("img"))) expect(img.getAttribute("alt")).toBe("")
})

test("the wordmark defaults to 20px high and reserves its width", () => {
  const { container } = render(<Logo />)
  expect(files(container)).toEqual(["/brand/quebi-wordmark-ink.png", "/brand/quebi-wordmark-light.png"])
  const img = container.querySelector("img")
  expect(img?.getAttribute("height")).toBe("20")
  expect(img?.getAttribute("width")).toBe("64")
})

test("the mark defaults to 36px square", () => {
  const { container } = render(<Logo variant="mark" />)
  expect(files(container)).toEqual(["/brand/quebi-mark-ink.png", "/brand/quebi-mark-light.png"])
  const img = container.querySelector("img")
  expect([img?.getAttribute("width"), img?.getAttribute("height")]).toEqual(["36", "36"])
})

test("srcInk and srcLight replace the shipped files", () => {
  const { container } = render(<Logo srcInk="/a.png" srcLight="/b.png" />)
  expect(files(container)).toEqual(["/a.png", "/b.png"])
})
