/**
 * Stat's markup and StatDelta's reading of a change.
 *
 * The markup is the guarantee a class rename could not break but a refactor
 * could: a stat is a term and its description, so it has to be a `<dt>`/`<dd>`
 * pair inside a `<dl>` whether or not a StatGroup is around it. The delta is
 * the branch: the arrow follows the sign, the colour follows whether that sign
 * is good news, and the arrow is decoration beside text that already says it.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { I18nProvider } from "react-aria-components"
import { Stat, StatDelta, StatGroup } from "../../src/components/stat"

function renderEn(ui: React.ReactElement) {
  return render(<I18nProvider locale="en-US">{ui}</I18nProvider>)
}

describe("Stat", () => {
  test("a stat on its own is a complete description list", () => {
    const { container } = renderEn(<Stat label="Signups" value={1284} />)

    const dl = container.querySelector("dl")
    expect(dl).not.toBeNull()
    expect(dl?.querySelector("dt")).toHaveTextContent("Signups")
    expect(dl?.querySelector("dd")).toHaveTextContent("1,284")
  })

  test("stats in a group share the group's list instead of nesting their own", () => {
    const { container } = renderEn(
      <StatGroup aria-label="This week">
        <Stat label="Signups" value={1284} />
        <Stat label="Errors" value={17} />
      </StatGroup>,
    )

    expect(container.querySelectorAll("dl")).toHaveLength(1)
    expect(container.querySelectorAll("dl > div > dt")).toHaveLength(2)
  })

  test("formats a numeric value with its options and renders a node as is", () => {
    renderEn(
      <StatGroup>
        <Stat
          label="MRR"
          value={18430}
          formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
        />
        <Stat label="Onboarding" value="3 of 5" />
      </StatGroup>,
    )

    expect(screen.getByText("€18,430")).toBeInTheDocument()
    expect(screen.getByText("3 of 5")).toBeInTheDocument()
  })

  test("no footer line when there is nothing to put in it", () => {
    const { container } = renderEn(<Stat label="Signups" value={1} />)

    expect(container.querySelectorAll("dd")).toHaveLength(1)
  })
})

describe("StatDelta", () => {
  function delta(ui: React.ReactElement) {
    const { container } = renderEn(ui)
    const el = container.querySelector("[data-slot=stat-delta]")
    if (!el) throw new Error("no delta rendered")
    return el
  }

  test("a rise is signed, points up and reads as good", () => {
    const el = delta(<StatDelta value={0.12} />)

    expect(el).toHaveTextContent("+12%")
    expect(el).toHaveAttribute("data-direction", "up")
    expect(el.className).toContain("text-quebi-success")
  })

  test("invert keeps the arrow and swaps the colour", () => {
    const fall = delta(<StatDelta value={-0.4} invert />)
    expect(fall).toHaveAttribute("data-direction", "down")
    expect(fall.className).toContain("text-quebi-success")

    const rise = delta(<StatDelta value={0.21} invert />)
    expect(rise).toHaveAttribute("data-direction", "up")
    expect(rise.className).toContain("text-quebi-danger")
  })

  test("no change is flat and neutral, with no sign", () => {
    const el = delta(<StatDelta value={0} />)

    expect(el).toHaveAttribute("data-direction", "flat")
    expect(el).toHaveTextContent(/^0%$/)
    expect(el.className).toContain("text-quebi-fg-muted")
  })

  test("the arrow is hidden from assistive tech; the signed text carries the direction", () => {
    const el = delta(<StatDelta value={-0.4} />)

    expect(el.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
    expect(el.textContent).toMatch(/^[-−]40%$/)
  })

  test("options make it an absolute change and keep the sign", () => {
    const el = delta(
      <StatDelta value={1240} options={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} />,
    )

    expect(el).toHaveTextContent("+€1,240")
  })
})
