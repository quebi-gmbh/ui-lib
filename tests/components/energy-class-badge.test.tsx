/**
 * EnergyClassBadge's accessibility contract.
 *
 * The badge encodes an EU energy class as a coloured chip. Two things about it
 * are guarantees rather than styling, and both are the kind that a refactor of
 * the variant table would quietly drop:
 *
 *  - the class letter is rendered as *text*, so colour is never the sole signal
 *    (WCAG 1.4.1), and unknown/legacy values ("A+") stay visible on a neutral
 *    chip instead of being silently dropped;
 *  - each band pins its own foreground colour rather than inheriting one, so
 *    the letter keeps its contrast against that band's fill in any theme.
 *
 * The fills themselves are only asserted to exist and to differ per band — the
 * exact EU hexes belong to the design record, not here.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { EnergyClassBadge } from "../../src/components/energy-class-badge"

const BANDS = ["A", "B", "C", "D", "E", "F", "G"] as const

/** The fixed foreground each band pins — dark ends white, bright middle black. */
const TEXT_CLASS: Record<(typeof BANDS)[number], string> = {
  A: "text-quebi-fg",
  B: "text-black",
  C: "text-black",
  D: "text-black",
  E: "text-black",
  F: "text-black",
  G: "text-quebi-fg",
}

/** Renders one badge and returns it, scoped to its own container so a test may
 *  render several and compare them. */
function renderBadge(props: React.ComponentProps<typeof EnergyClassBadge>) {
  const { container } = render(<EnergyClassBadge {...props} />)
  const badge = container.querySelector("span")
  if (!badge) throw new Error("EnergyClassBadge rendered nothing")
  return badge
}

const fillOf = (badge: Element) =>
  Array.from(badge.classList).find((name) => name.startsWith("bg-"))

describe("EnergyClassBadge", () => {
  test("renders the class letter as visible text", () => {
    expect(renderBadge({ energyClass: "A" })).toHaveTextContent("A")
  })

  test("normalises case and surrounding whitespace to the canonical band", () => {
    const badge = renderBadge({ energyClass: "  c " })

    expect(badge).toHaveTextContent("C")
    expect(fillOf(badge)).toBe(fillOf(renderBadge({ energyClass: "C" })))
  })

  test.each(BANDS.map((band) => [band] as const))("band %s pins its own fill and a fixed text colour", (band) => {
    const badge = renderBadge({ energyClass: band })

    expect(badge).toHaveTextContent(band)
    expect(fillOf(badge)).toMatch(/^bg-\[#/)
    expect(badge).toHaveClass(TEXT_CLASS[band])
  })

  test("every band's fill is distinct — the scale is seven colours, not five", () => {
    const fills = BANDS.map((band) => fillOf(renderBadge({ energyClass: band })))

    expect(new Set(fills).size).toBe(BANDS.length)
  })

  test("unknown and legacy values render verbatim on the neutral chip", () => {
    const badge = renderBadge({ energyClass: "A+" })

    expect(badge).toHaveTextContent("A+")
    expect(fillOf(badge)).not.toMatch(/^bg-\[#/)
    expect(fillOf(badge)).toBe(fillOf(renderBadge({ energyClass: "" })))
  })

  test("forwards aria-label for a fuller screen-reader description", () => {
    render(<EnergyClassBadge energyClass="A" aria-label="Energy efficiency class A" />)

    expect(screen.getByLabelText("Energy efficiency class A")).toHaveTextContent("A")
  })

  test("a caller's className lands alongside the band classes, not instead of them", () => {
    const badge = renderBadge({ energyClass: "A", className: "ml-2" })

    expect(badge).toHaveClass("ml-2")
    expect(badge).toHaveClass(TEXT_CLASS.A)
  })
})
