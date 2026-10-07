/** LowTitle: the heading level is the caller's, and the aside appears only with content. */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { LowTitle } from "../../src/components/low-title"

test("renders an h2 by default and an h1 when asked", () => {
  const { rerender } = render(<LowTitle title="contact." />)
  expect(screen.getByRole("heading", { level: 2, name: "contact." })).toBeInTheDocument()
  rerender(<LowTitle as="h1" title="contact." />)
  expect(screen.getByRole("heading", { level: 1, name: "contact." })).toBeInTheDocument()
})

for (const size of ["m", "xl"] as const) {
  test(`size ${size} renders the sentence and the action`, () => {
    render(
      <LowTitle size={size} title="full-stack software." action={<span>get started →</span>}>
        Two developers, Munich.
      </LowTitle>,
    )
    expect(screen.getByText("Two developers, Munich.").tagName).toBe("P")
    expect(screen.getByText("get started →")).toBeInTheDocument()
  })
}

test("a title alone draws no empty paragraph", () => {
  const { container } = render(<LowTitle title="contact." />)
  expect(container.querySelector("p")).toBeNull()
})
