/**
 * Panel's two input-dependent branches: the element it renders, and whether it
 * bleeds through a Container's gutter. The band itself has no behaviour.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Panel } from "../../src/components/panel"

describe("Panel", () => {
  test("renders a div by default and a labelled region as a section", () => {
    const { rerender } = render(<Panel data-testid="panel">Body</Panel>)
    expect(screen.getByTestId("panel").tagName).toBe("DIV")

    rerender(
      <Panel as="section" aria-label="Workspace">
        Body
      </Panel>,
    )
    expect(screen.getByRole("region", { name: "Workspace" })).toBeInTheDocument()
  })

  test("bleed swaps the fixed inset for the Container's gutter", () => {
    const { rerender } = render(<Panel data-testid="panel">Body</Panel>)
    expect(screen.getByTestId("panel").className).toContain("px-6")

    rerender(
      <Panel data-testid="panel" bleed>
        Body
      </Panel>,
    )
    const cls = screen.getByTestId("panel").className
    expect(cls).toContain("-mx-(--container-padding)")
    expect(cls).not.toContain("px-6")
  })
})
