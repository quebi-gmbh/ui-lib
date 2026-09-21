/**
 * The site's loading and empty states (task #197).
 *
 * Two properties are worth a test rather than an eye:
 *
 * - the gallery's fallback is the gallery's *shape* — one unit per example that
 *   is coming, not one bar for all of them, because a 240px block replaced by
 *   several thousand pixels in one frame moves the scroll position and tells
 *   the reader nothing about how much is left;
 * - a fallback is never also an empty state. The source block used to render
 *   `<Skeleton className="h-40" />` both while its chunk was in flight and when
 *   there was no chunk at all, so a component with no baked source pulsed
 *   forever and read exactly like a slow connection.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import {
  CodeBlockSkeleton,
  ExampleCardSkeleton,
  GallerySkeleton,
  SourceUnavailable,
} from "../src/site/page-states"

const skeletons = (root: HTMLElement) => root.querySelectorAll("[data-slot=skeleton]")
const cards = (root: HTMLElement) => root.querySelectorAll("[data-slot=card]")

describe("the gallery fallback", () => {
  test("is one unit per example that is coming", () => {
    const { container } = render(<GallerySkeleton count={7} />)

    expect(cards(container)).toHaveLength(7)
    // Each unit is heading bar + description line + the body inside the card.
    expect(skeletons(container)).toHaveLength(7 * 3)
  })

  test("renders nothing for a gallery with nothing in it", () => {
    const { container } = render(<GallerySkeleton count={0} />)

    expect(skeletons(container)).toHaveLength(0)
    expect(cards(container)).toHaveLength(0)
  })

  test("varies its widths deterministically, so the prerendered HTML is the hydrated one", () => {
    const first = render(<GallerySkeleton count={6} />).container.innerHTML
    const second = render(<GallerySkeleton count={6} />).container.innerHTML

    expect(first).toBe(second)
    // …and it is variety, not six identical rows.
    const widths = new Set(
      Array.from(skeletons(render(<GallerySkeleton count={6} />).container)).map(
        (el) => Array.from(el.classList).find((c) => c.startsWith("w-")) ?? "",
      ),
    )
    expect(widths.size).toBeGreaterThan(1)
  })

  test("keeps the card outline, so only the contents arrive late", () => {
    const { container } = render(<ExampleCardSkeleton />)

    const card = cards(container)[0]
    expect(card).toBeDefined()
    // The class list the route puts on the real example card.
    expect(card?.className).toContain("min-h-30")
    expect(card?.className).toContain("p-8")
    expect(card?.querySelectorAll("[data-slot=skeleton]")).toHaveLength(1)
  })
})

describe("the source block", () => {
  test("waits with the shape of a code block", () => {
    const { container } = render(<CodeBlockSkeleton lines={9} />)

    expect(cards(container)).toHaveLength(1)
    expect(skeletons(container)).toHaveLength(9)
  })

  test("says so in words when there is no source, instead of pulsing forever", () => {
    const { container } = render(<SourceUnavailable slug="area-chart" />)

    expect(skeletons(container)).toHaveLength(0)
    expect(screen.getByText(/no source for this component yet/i)).toBeInTheDocument()
    expect(container.textContent).toContain("area-chart")
  })
})
