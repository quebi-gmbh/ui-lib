/**
 * A carousel's journey from one month to another.
 *
 * `month-view-ranges.test.tsx` covers the carousel at rest. This file is about
 * the band while it moves, because each of the things below was once done a
 * simpler way that looked right in a test and wrong on a screen:
 *
 * 1. **The whole distance is travelled.** A jump to next year slides past every
 *    month between, not one cell from the side it came from.
 * 2. **Only the ends are drawn.** The window left and the window arrived at,
 *    with their peeks, are real grids; the months passed are placeholders of the
 *    right shape with nothing in them.
 * 3. **The band is laid out against an origin held still for the journey.** So
 *    a press mid-flight is only a new target, and nothing on screen jumps to
 *    make room for the months it adds.
 * 4. **The date does not wait.** The label has the new month on the first
 *    frame; the band comes to rest after, and is laid out again in a frame with
 *    no transitions because that changes numbers and not pixels.
 *
 * Two months at a quarter peek throughout: 2.5 cells across the window, so a
 * cell is 40% of it and a band at rest reads `translateX(10%)`.
 */
import { afterEach, describe, expect, test } from "bun:test"
import { type CalendarDate, parseZonedDateTime, toCalendarDate } from "@internationalized/date"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MonthView } from "../../src/components/month-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture date the calendar suites share. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const CAROUSEL = { months: 2, carousel: { peek: 0.25 } } as const

/** The carousel, `months` months from September. */
const at = (months: number) => (
  <MonthView
    date={MONDAY.add({ months })}
    events={[]}
    locale={LOCALE}
    timeZone={ZONE}
    now={null}
    range={CAROUSEL}
  />
)

const band = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="month-band"]') as HTMLElement
const origin = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="month-band-origin"]') as HTMLElement

/** Each cell of the band: a real month, or a placeholder the band is passing. */
const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-slot="month-cell"]')).map((cell) =>
    cell.querySelector('[data-slot="month-placeholder"]') ? "placeholder" : "month",
  )

/**
 * A `transitionend` for `propertyName`, the way a browser dispatches one.
 *
 * Built by hand because happy-dom's `TransitionEvent` drops `propertyName`, and
 * the band tells its own transform finishing apart from everything else that
 * bubbles to it by exactly that field.
 */
const transitionEnd = (element: HTMLElement, propertyName: string) => {
  const event = new Event("transitionend", { bubbles: true })
  Object.defineProperty(event, "propertyName", { value: propertyName })
  fireEvent(element, event)
}

/** Tell the band its transform transition has finished. */
const arrive = (container: HTMLElement) => transitionEnd(band(container), "transform")

/** Class names as tokens, so `transition-none` is not found inside `motion-reduce:transition-none`. */
const classes = (element: HTMLElement) => element.className.split(/\s+/)

describe("a carousel's journey", () => {
  test("a step travels one cell, and comes to rest laid out around where it stopped", () => {
    const { container, rerender } = render(at(0))
    expect(band(container).style.transform).toBe("translateX(10%)")

    rerender(at(1))
    // The date is not waiting for the band: the heading is October's already.
    expect(screen.getByText("Oktober–November 2026")).toBeInTheDocument()
    // One cell further on, travelling on the house curve for things that move.
    expect(band(container).style.transform).toBe("translateX(-30%)")
    expect(classes(band(container))).toContain("ease-quebi-travel")
    expect(classes(band(container))).not.toContain("transition-none")
    expect(band(container).style.transitionDuration).toBe("400ms")
    // A step's two ends overlap, so there is nothing between them to stand in
    // for: five real months, August to December.
    expect(cells(container)).toEqual(["month", "month", "month", "month", "month"])

    arrive(container)
    // At rest again, laid out around October. Same pixels, different numbers —
    // which is why that frame has no transition to animate them with.
    expect(cells(container)).toHaveLength(4)
    expect(band(container).style.transform).toBe("translateX(10%)")
    expect(origin(container).style.marginLeft).toBe("-40%")
    expect(classes(band(container))).toContain("transition-none")
  })

  test("a jump passes every month between, and draws only its two ends", () => {
    const { container, rerender } = render(at(0))
    rerender(at(12))

    // August 2026 to November 2027: sixteen cells, the whole run the band can
    // be seen to pass over. The window it left and the window it is going to,
    // each with its peeks, are months; the eight between are placeholders.
    const run = cells(container)
    expect(run).toHaveLength(16)
    expect(run.slice(0, 4)).toEqual(["month", "month", "month", "month"])
    expect(run.slice(4, 12)).toEqual(Array(8).fill("placeholder"))
    expect(run.slice(12)).toEqual(["month", "month", "month", "month"])

    // A placeholder is the right shape and nothing else: no days, no events.
    const passed = container.querySelector('[data-slot="month-placeholder"]') as HTMLElement
    expect(passed.querySelectorAll("button")).toHaveLength(0)
    expect(passed.querySelector('[data-slot="month-grid"]')).toBeNull()

    // Twelve cells of travel, and a little longer than a step to cover them —
    // capped, so a jump across years is still a jump.
    expect(band(container).style.transform).toBe("translateX(-470%)")
    expect(band(container).style.transitionDuration).toBe("900ms")
  })

  test("backwards the same way, with the band growing at its near end", () => {
    const { container, rerender } = render(at(0))
    rerender(at(-12))

    // The band now starts at August 2025, thirteen cells before the origin,
    // and the spacer takes up exactly those — September 2026 has not moved.
    expect(cells(container)).toHaveLength(16)
    expect(origin(container).style.marginLeft).toBe("-520%")
    expect(band(container).style.transform).toBe("translateX(490%)")
  })

  test("a press mid-flight carries on from where the band is", () => {
    const { container, rerender } = render(at(0))
    rerender(at(1))
    rerender(at(2))

    // The origin has not moved, so nothing on screen has either: only the
    // target has, and the browser retargets the running transition from
    // wherever it had got to. On `ease-out`, because the band is already
    // moving and easing in again would stall it.
    expect(origin(container).style.marginLeft).toBe("-40%")
    expect(band(container).style.transform).toBe("translateX(-70%)")
    expect(classes(band(container))).toContain("ease-out")
    expect(classes(band(container))).not.toContain("ease-quebi-travel")
    // Every window this journey has headed for is drawn: August to January.
    expect(cells(container)).toEqual(Array(6).fill("month"))
  })

  test("only the band's own transform ends a journey", () => {
    const { container, rerender } = render(at(0))
    rerender(at(1))

    // Something inside the band finishing — even a transform — bubbles up to
    // it and is not the band arriving; nor is any other property of the band.
    const cell = container.querySelector('[data-slot="month-cell"]') as HTMLElement
    transitionEnd(cell, "transform")
    transitionEnd(cell, "flex-basis")
    transitionEnd(band(container), "opacity")
    expect(cells(container)).toHaveLength(5)

    arrive(container)
    expect(cells(container)).toHaveLength(4)
  })

  test("a journey that never reports ending is settled anyway", async () => {
    // A background tab, a band never laid out: a transition that did not run
    // never ends, and the band would carry its journey around forever.
    const { container, rerender } = render(at(0))
    rerender(at(1))
    expect(cells(container)).toHaveLength(5)
    await waitFor(() => expect(cells(container)).toHaveLength(4), { timeout: 1500 })
  })
})

describe("with reduced motion", () => {
  const matchMedia = window.matchMedia
  afterEach(() => {
    window.matchMedia = matchMedia
  })

  test("the band arrives without travelling", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia

    const { container, rerender } = render(at(0))
    rerender(at(12))

    // Laid out at rest around the target at once: no run of placeholders, no
    // journey waiting on a transition that is never going to run.
    expect(cells(container)).toHaveLength(4)
    expect(band(container).style.transform).toBe("translateX(10%)")
    expect(classes(band(container))).toContain("transition-none")
    expect(screen.getByText("September–Oktober 2027")).toBeInTheDocument()
  })
})
