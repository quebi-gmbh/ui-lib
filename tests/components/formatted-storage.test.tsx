/**
 * FormattedStorage's rollup and its empty cases.
 *
 * Two things are contractual. The GB → TB rollup happens at exactly 1024 and
 * keeps one decimal for fractional TB, so "1536" reads as "1.5TB" rather than
 * as a four-digit number nobody parses. And a missing capacity renders *no
 * element* — not "0GB", not an empty span — because the component is dropped
 * into spec tables where a stray empty chip is worse than a blank cell.
 *
 * `formatStorage` is module-private, so the assertions go through the rendered
 * span: that is the surface consumers have, and it covers "renders nothing" as
 * well, which a pure string test cannot.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { FormattedStorage } from "../../src/components/formatted-storage"

const label = (value: number | null | undefined, className?: string) => {
  const { container } = render(<FormattedStorage value={value} className={className} />)
  return container.querySelector("span")
}

describe("FormattedStorage", () => {
  test.each([
    [128, "128GB"],
    [256, "256GB"],
    [512, "512GB"],
    [1023, "1023GB"],
  ])("renders %pGB below the rollup as GB", (value, expected) => {
    expect(label(value)).toHaveTextContent(expected)
  })

  test.each([
    [1024, "1TB"],
    [2048, "2TB"],
    [4096, "4TB"],
  ])("rolls %p GB up to whole TB with no decimal", (value, expected) => {
    expect(label(value)).toHaveTextContent(expected)
  })

  test.each([
    [1536, "1.5TB"],
    [1280, "1.3TB"],
  ])("keeps one decimal for a fractional TB (%p)", (value, expected) => {
    expect(label(value)).toHaveTextContent(expected)
  })

  test.each([[0], [null], [undefined]])("renders nothing at all for %p", (value) => {
    expect(label(value)).toBeNull()
  })

  test("a caller's className lands alongside the component's own", () => {
    const span = label(128, "text-quebi-fg-muted")

    expect(span).toHaveClass("text-quebi-fg-muted")
    expect(span).toHaveClass("tabular-nums")
  })
})
