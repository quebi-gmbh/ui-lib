/**
 * Sparkline's arithmetic, which is all of it.
 *
 * The component is one `<svg>` computed during render, so every way it can be
 * wrong is a number: a flat series dividing by a zero span, a value sitting on
 * the floor of the domain drawn as a zero-height rect and reading as missing
 * data, a per-row domain quietly making three different scales out of one
 * column. None of those throws and none of them looks broken on its own.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { Sparkline } from "../../src/components/sparkline"

const rects = () => Array.from(document.querySelectorAll<SVGRectElement>("rect"))
const line = () => document.querySelector('[data-slot="sparkline-line"]')
const pointsOf = (element: Element | null) =>
  (element?.getAttribute("points") ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((pair) => pair.split(",").map(Number))

describe("the domain", () => {
  test("a flat series draws a flat line rather than dividing by zero", () => {
    render(<Sparkline data={[7, 7, 7, 7]} />)
    const ys = pointsOf(line()).map(([, y]) => y)
    expect(ys.every(Number.isFinite)).toBe(true)
    expect(new Set(ys).size).toBe(1)
  })

  test("an explicit domain is what makes two rows comparable", () => {
    // The same flat-ish series on a shared domain must not be drawn as the
    // same picture as a dramatic one — which is exactly what self-normalising
    // each row would do.
    const { rerender } = render(<Sparkline data={[23, 25, 24, 26]} min={0} max={100} />)
    const shared = pointsOf(line()).map(([, y]) => y)
    const sharedSpread = Math.max(...shared) - Math.min(...shared)

    rerender(<Sparkline data={[23, 25, 24, 26]} />)
    const normalised = pointsOf(line()).map(([, y]) => y)
    const normalisedSpread = Math.max(...normalised) - Math.min(...normalised)

    expect(sharedSpread).toBeLessThan(normalisedSpread)
  })

  test("an empty series renders the box and no marks", () => {
    render(<Sparkline data={[]} />)
    expect(line()).toBeNull()
    expect(rects()).toHaveLength(0)
    expect(document.querySelector('[data-slot="sparkline-graphic"]')).not.toBeNull()
  })
})

describe("the bars variant", () => {
  test("a value on the floor of the domain is still a bar", () => {
    // A 0px rect reads as missing data, which is a different statement from
    // "this value is the lowest one".
    render(<Sparkline data={[0, 5, 10]} variant="bars" min={0} max={10} height={16} />)
    const heights = rects().map((rect) => Number(rect.getAttribute("height")))
    expect(heights).toHaveLength(3)
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...heights)).toBe(16)
  })

  test("the bars fill the width without overflowing it", () => {
    render(<Sparkline data={[1, 2, 3, 4, 5]} variant="bars" width={64} />)
    const last = rects().at(-1)
    const right = Number(last?.getAttribute("x")) + Number(last?.getAttribute("width"))
    expect(right).toBeCloseTo(64, 5)
  })
})

describe("naming it", () => {
  test("the svg is always decoration", () => {
    render(<Sparkline data={[1, 2, 3]} aria-label="Signups, rising" />)
    expect(
      document.querySelector('[data-slot="sparkline-graphic"]')?.getAttribute("aria-hidden"),
    ).toBe("true")
  })

  test("an aria-label promotes the wrapper to a role=img, and nothing else does", () => {
    const { rerender } = render(<Sparkline data={[1, 2, 3]} />)
    expect(document.querySelector('[data-slot="sparkline"]')?.getAttribute("role")).toBeNull()

    rerender(<Sparkline data={[1, 2, 3]} aria-label="Signups, rising" />)
    expect(document.querySelector('[data-slot="sparkline"]')?.getAttribute("role")).toBe("img")
  })

  test("children render beside the glyph as its visible label", () => {
    render(<Sparkline data={[1, 2, 3]}>47</Sparkline>)
    expect(document.querySelector('[data-slot="sparkline-label"]')?.textContent).toBe("47")
  })
})

describe("the marker", () => {
  test("is opt-in and sits on the last point", () => {
    const { rerender } = render(<Sparkline data={[1, 5, 2]} width={64} />)
    expect(document.querySelector('[data-slot="sparkline-marker"]')).toBeNull()

    rerender(<Sparkline data={[1, 5, 2]} width={64} marker />)
    const marker = document.querySelector('[data-slot="sparkline-marker"]')
    const lastPoint = pointsOf(line()).at(-1)
    expect(Number(marker?.getAttribute("cx"))).toBeCloseTo(lastPoint?.[0] ?? -1, 5)
    expect(Number(marker?.getAttribute("cy"))).toBeCloseTo(lastPoint?.[1] ?? -1, 5)
  })
})
