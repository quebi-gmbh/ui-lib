/**
 * What `range` makes of a month grid: two months side by side, or a rolling
 * strip of weeks.
 *
 * Both are the same grid and the same packing; the differences are four, and
 * each of them is a thing that was once assumed rather than decided:
 *
 * 1. **A grid dims against its own month.** The 1st of October is drawn twice
 *    in a two-month view — a trailing day of September's grid and the first day
 *    of October's — and it is dimmed in one of them. Dimming is per grid, not
 *    per view.
 * 2. **A strip has no month at all**, so nothing in it is outside it and
 *    nothing is dimmed. The one seam left is where the months change, and the
 *    1st says so itself: `1. Okt.` rather than `1`.
 * 3. **The chevrons step what is on show.** Two months step two months, so no
 *    month is read twice; a strip steps one week, which is what makes it slide
 *    rather than page.
 * 4. **The heading names the range and opens the picker that fits it** — a
 *    month range for months, the strip's two ends and a week picker for a
 *    strip, because the start week is the only thing about it the reader picks.
 *
 * `weekStrip` is the arithmetic under the third and fourth of those, so it is
 * checked here rather than beside `monthRange`. Locale, zone and date are
 * pinned in every case, so nothing here depends on the machine running it.
 */
import { describe, expect, test } from "bun:test"
import { type CalendarDate, parseZonedDateTime, toCalendarDate } from "@internationalized/date"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MonthView } from "../../src/components/month-view"
import { weekStrip } from "../../src/lib/calendar"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture date the calendar suites share. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const view = (props: Partial<React.ComponentProps<typeof MonthView>> = {}) =>
  render(
    <MonthView date={MONDAY} events={[]} locale={LOCALE} timeZone={ZONE} now={null} {...props} />,
  )

/** The band's cells, in order: how wide, whether outside the window, how tall. */
const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-slot="month-band"] > div')).map(
    (cell) => ({
      basis: cell.style.flexBasis,
      outside: cell.querySelector("[inert]") !== null,
      rows: cell.querySelectorAll('[data-slot="month-grid"] > div').length,
    }),
  )

/** Every day button of a grid, in order: what it says, and whether it is dimmed. */
const dayCells = (grid: Element) =>
  Array.from(grid.querySelectorAll("button")).map((cell) => ({
    text: cell.textContent,
    dim: cell.className.includes("text-quebi-fg-subtle"),
  }))

describe("weekStrip", () => {
  test("is the rows a month grid is made of, counted out from any week", () => {
    const strip = weekStrip(MONDAY, LOCALE, 8)
    expect(strip).toHaveLength(8)
    expect(strip.every((week) => week.length === 7)).toBe(true)
    // It starts on the anchor's own week and runs straight on through the end
    // of September: eight weeks is fifty-six days, and none of them is skipped.
    expect(strip[0]?.[0]?.toString()).toBe("2026-09-21")
    expect(strip[7]?.[6]?.toString()).toBe("2026-11-15")
    expect(strip.flat()).toHaveLength(56)
  })

  test("starts where the locale's week does, and is never empty", () => {
    expect(weekStrip(MONDAY, "en-US", 2)[0]?.[0]?.toString()).toBe("2026-09-20")
    // A view of no weeks is a bug wherever it is drawn, so the count clamps.
    expect(weekStrip(MONDAY, LOCALE, 0)).toHaveLength(1)
  })
})

describe("range={{ months: 2 }}", () => {
  test("is two grids under one heading, each dimming its own month", () => {
    const { container } = view({ range: { months: 2 } })

    // Two grids, September and October, each with its own weekday header row.
    const grids = Array.from(container.querySelectorAll('[data-slot="month-grid"]'))
    expect(grids).toHaveLength(2)
    expect(container.querySelectorAll(".grid-cols-7.border-b")).toHaveLength(2)

    // One heading over both, with the year said once because they share it.
    expect(screen.getByText("September–Oktober 2026")).toBeInTheDocument()

    const september = dayCells(grids[0] as Element)
    const october = dayCells(grids[1] as Element)
    // September 2026 begins on a Tuesday and October on a Thursday, so each
    // grid leads with the days of the month before it, dimmed.
    expect(september[0]).toEqual({ text: "31", dim: true })
    expect(october[0]).toEqual({ text: "28", dim: true })

    // Each grid holds two 1sts — its own month's and the next one's — and
    // dims the one it is outside of, which is the whole of the difference
    // between drawing two months and drawing nine weeks.
    expect(september.filter((cell) => cell.text === "1")).toEqual([
      { text: "1", dim: false },
      { text: "1", dim: true },
    ])
    expect(october.filter((cell) => cell.text === "1")).toEqual([
      { text: "1", dim: false },
      { text: "1", dim: true },
    ])
  })

  test("steps a whole page, so no month is read twice", async () => {
    const stepped: string[] = []
    view({ range: { months: 2 }, onDateChange: (day) => stepped.push(day.toString()) })

    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }))
    expect(stepped).toEqual(["2026-11-21"])
  })
})

describe("range={{ weeks: 8 }}", () => {
  test("is eight rows from the anchor's week, with nothing outside them", () => {
    const { container } = view({ range: { weeks: 8 } })

    const grid = container.querySelector('[data-slot="month-grid"]')
    expect(container.querySelectorAll('[data-slot="month-grid"]')).toHaveLength(1)
    expect(grid?.children).toHaveLength(8)

    const cells = dayCells(grid as Element)
    expect(cells).toHaveLength(56)
    expect(cells[0]?.text).toBe("21")
    expect(cells[55]?.text).toBe("15")

    // Nothing is outside a strip, so nothing is dimmed — and the two 1sts it
    // crosses carry their month, which is the only seam mark it has.
    expect(cells.some((cell) => cell.dim)).toBe(false)
    expect(cells.filter((cell) => cell.text?.includes("."))).toEqual([
      { text: "1. Okt.", dim: false },
      { text: "1. Nov.", dim: false },
    ])
  })

  test("names its ends, and opens a week picker on them", async () => {
    const stepped: string[] = []
    view({ range: { weeks: 8 }, onDateChange: (day) => stepped.push(day.toString()) })

    // The heading is the range label the week view uses, over eight weeks
    // instead of one — a strip has no month to be named after.
    expect(screen.getByRole("button", { name: /21\. Sept\. – 15\. Nov\. 2026/ })).toBeInTheDocument()

    // And it slides a week at a time: the reader picks a start week, not a page.
    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }))
    expect(stepped).toEqual(["2026-09-28"])
  })
})

describe("range={{ months: 2, carousel: true }}", () => {
  test("draws two months more at each end than it shows, and makes them inert", () => {
    const { container } = view({ range: { months: 2, carousel: true } })

    // Two months in the window, one peeking at each end, and one spare behind
    // each peek for a step to slide into: six grids drawn, four of them inert.
    const band = cells(container)
    expect(band).toHaveLength(6)
    expect(band.map((cell) => cell.outside)).toEqual([true, true, false, false, true, true])
    expect(container.querySelectorAll('[data-slot="month-grid"]')).toHaveLength(6)

    // The heading names the window, not the band: the four around it are
    // drawn, and nobody is looking at them.
    expect(screen.getByText("September–Oktober 2026")).toBeInTheDocument()
  })

  test("every month in the band is six rows, so nothing moves when one steps", () => {
    // A month grid that drew only the rows its month needs would make the
    // whole calendar two rows shorter in February — and the chevrons, which
    // are centred on it, would move under the press that stepped there.
    const { container } = view({ range: { months: 2, carousel: true } })
    expect(cells(container).map((cell) => cell.rows)).toEqual([6, 6, 6, 6, 6, 6])
  })

  test("is laid out in percentages of the window, peek included", () => {
    // Two months and a quarter of a month at each end is 2.5 cells across, so
    // a cell is 40% of the window. The band starts two cells before the window,
    // so sliding it by all but the peek of those two — 1.75 cells, 70% —
    // puts September at the window's left edge with August peeking in.
    const { container } = view({ range: { months: 2, carousel: { peek: 0.25 } } })
    expect(cells(container)[0]?.basis).toBe("40%")

    const track = container.querySelector<HTMLElement>('[data-slot="month-band"]')
    expect(track?.style.transform).toBe("translateX(-70%)")
  })

  test("steps one month, because the month peeking in is the one you get", async () => {
    const stepped: string[] = []
    view({
      range: { months: 2, carousel: true },
      onDateChange: (day) => stepped.push(day.toString()),
    })

    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }))
    expect(stepped).toEqual(["2026-10-21"])
  })

  test("the reader chooses how many months are in the window", async () => {
    const chosen: number[] = []
    const { container } = view({
      range: { months: 2, carousel: true },
      onMonthsChange: (count) => chosen.push(count),
    })

    // The control offers the default counts, with the current one selected.
    const group = screen.getByRole("radiogroup", { name: "Months shown" })
    expect(Array.from(group.querySelectorAll("button")).map((item) => item.textContent)).toEqual([
      "1",
      "2",
      "3",
    ])
    expect(screen.getByRole("radio", { name: "2 months" })).toHaveAttribute("aria-checked", "true")

    await userEvent.setup().click(screen.getByRole("radio", { name: "3 months" }))
    expect(chosen).toEqual([3])
    // Three in the window and two either side: seven grids, each narrower.
    expect(cells(container)).toHaveLength(7)
    expect(screen.getByText("September–November 2026")).toBeInTheDocument()
  })

  test("an empty choice list is the carousel with the reader's half turned off", () => {
    const { container } = view({ range: { months: 2, carousel: { choices: [] } } })

    expect(screen.queryByRole("radiogroup", { name: "Months shown" })).toBeNull()
    expect(cells(container)).toHaveLength(6)
  })

  test("a count the choices do not offer is added to them, so one is always on", () => {
    view({ range: { months: 4, carousel: { choices: [1, 2] } } })

    const group = screen.getByRole("radiogroup", { name: "Months shown" })
    expect(Array.from(group.querySelectorAll("button")).map((item) => item.textContent)).toEqual([
      "1",
      "2",
      "4",
    ])
    expect(screen.getByRole("radio", { name: "4 months" })).toHaveAttribute("aria-checked", "true")
  })
})

describe("the carousel's peeking months", () => {
  const peeks = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('[data-slot="month-peek"]'))
  const veils = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('[data-slot="month-peek-veil"]'))

  test("carry a chevron onto the month they are a picture of", async () => {
    const stepped: string[] = []
    const { container } = view({
      range: { months: 2, carousel: true },
      onDateChange: (day) => stepped.push(day.toString()),
    })

    const back = container.querySelector<HTMLElement>('[aria-label="Previous month"]')
    const forward = container.querySelector<HTMLElement>('[aria-label="Next month"]')
    expect(back).not.toBeNull()
    expect(forward).not.toBeNull()

    const user = userEvent.setup()
    await user.click(forward as HTMLElement)
    await user.click(back as HTMLElement)
    // One month each way — the same two presses the toolbar's chevrons are.
    // `date` is pinned here, so the second press measures from September too.
    expect(stepped).toEqual(["2026-10-21", "2026-08-21"])
  })

  test("the chevrons are the pointer's path while the toolbar is the keyboard's", () => {
    const { container, rerender } = view({ range: { months: 2, carousel: true } })

    // With a toolbar the same two presses are already in the tab order, so
    // these are hidden from it and from the accessible tree.
    const withToolbar = container.querySelector<HTMLElement>('[aria-label="Next month"]')
    expect(withToolbar).toHaveAttribute("tabindex", "-1")
    expect(withToolbar?.parentElement).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByRole("button", { name: "Next month" })).toBeNull()

    rerender(
      <MonthView
        date={MONDAY}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        range={{ months: 2, carousel: true }}
        showToolbar={false}
      />,
    )
    // Without one they are the only way through the months, and then they are
    // everyone's.
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument()
  })

  test("cover the strip of the window a peek shows through, at its two edges", () => {
    // A peeking month is a whole month wide and only `peek` of it is inside
    // the viewport. The overlays are that strip — a share of the *window*, not
    // of the month — pinned to the edge it appears at, which is why they hold
    // still while the band slides under them. Over the month instead, they
    // spend themselves in the clipped part and nothing is drawn at all.
    const { container } = view({ range: { months: 2, carousel: { peek: 0.3 } } })

    const [leading, trailing] = peeks(container)
    const cell = Number.parseFloat(cells(container)[0]?.basis ?? "0")
    expect(Number.parseFloat(leading?.style.width ?? "0")).toBeCloseTo(0.3 * cell, 6)
    expect(Number.parseFloat(trailing?.style.width ?? "0")).toBeCloseTo(0.3 * cell, 6)
    expect(leading?.className).toContain("left-0")
    expect(trailing?.className).toContain("right-0")

    // The chevrons are inside those same two boxes, so they are pinned too.
    expect(leading?.querySelector('[aria-label="Previous month"]')).not.toBeNull()
    expect(trailing?.querySelector('[aria-label="Next month"]')).not.toBeNull()
  })

  test("the veil ramps outwards, mirrored at the two ends, and lifts on hover", () => {
    const { container } = view({ range: { months: 2, carousel: true } })

    const [leading, trailing] = veils(container)
    expect(veils(container)).toHaveLength(2)

    // Two blur layers and a dimming gradient, each masked from the outer edge
    // inwards — and mirrored, so both ends blur away from the window.
    const layers = (veil: HTMLElement) =>
      Array.from(veil.children).map((layer) => layer.className)
    const [leadingNear, leadingFar, leadingDim] = layers(leading as HTMLElement)
    expect(leadingNear).toContain("backdrop-blur-xs")
    expect(leadingFar).toContain("backdrop-blur-xs")
    expect(leadingNear).toContain("mask-r-from-0% mask-r-to-100%")
    expect(leadingFar).toContain("mask-r-from-0% mask-r-to-50%")
    expect(leadingDim).toContain("bg-gradient-to-l from-transparent to-quebi-bg/70")

    const [trailingNear, trailingFar, trailingDim] = layers(trailing as HTMLElement)
    expect(trailingNear).toContain("backdrop-blur-xs")
    expect(trailingFar).toContain("backdrop-blur-xs")
    expect(trailingNear).toContain("mask-l-from-0% mask-l-to-100%")
    expect(trailingFar).toContain("mask-l-from-0% mask-l-to-50%")
    expect(trailingDim).toContain("bg-gradient-to-r from-transparent to-quebi-bg/70")

    // Hovering eases the veil rather than clearing it: the compounding blur
    // goes — eight pixels at the outer edge become four, on the same ramp —
    // the wide one stays, and the tint lightens. A peek at full sharpness is a
    // second window with nothing but its position saying it is not one.
    expect(leadingNear).toContain("group-hover/peek:opacity-80")
    expect(leadingFar).toContain("group-hover/peek:opacity-0")
    expect(leadingDim).toContain("group-hover/peek:opacity-40")

    // Every layer fades on its own rather than the box around them fading for
    // all three: an ancestor below full opacity is a backdrop root, and a
    // `backdrop-filter` inside one samples nothing, so a wrapper fade would
    // drop both blurs on the transition's first frame.
    for (const veil of veils(container)) {
      expect(veil.className).not.toContain("opacity")
      for (const layer of Array.from(veil.children)) {
        expect(layer.className).toContain("group-hover/peek:opacity-")
        expect(layer.className).toContain("transition-opacity")
      }
    }

    // The month behind it is still inert while the veil is lifted: seeing next
    // month is not being in it.
    expect(cells(container)[1]?.outside).toBe(true)
    // And the hover is the overlay's own, so hovering the middle of the window
    // does not clear the veils at its edges.
    for (const peek of peeks(container)) {
      expect(peek.className).toContain("group/peek")
    }
  })

  test("a move is inverted for a frame, which is what the reader sees travel", () => {
    // The press commits the month at once and the band is put back where it
    // was for one frame, without a transition, then released. Two months at a
    // quarter peek is a 40% cell and a -70% band; inverted by one cell that is
    // -30%, which is exactly where the band stood before the press.
    const carousel = { months: 2, carousel: { peek: 0.25 } } as const
    const at = (months: number) => (
      <MonthView
        date={MONDAY.add({ months })}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        range={carousel}
      />
    )

    const { container, rerender } = view({ range: carousel })
    const band = () => container.querySelector<HTMLElement>('[data-slot="month-band"]')
    // Nothing has moved yet, so nothing is inverted.
    expect(band()?.style.transform).toBe("translateX(-70%)")

    rerender(at(1))
    expect(band()?.style.transform).toBe("translateX(-30%)")
    expect(band()?.className).toContain("transition-none")

    // `Today` and the month picker move further than the band can hold, so
    // they travel one cell from the side they came from — the inversion is
    // capped, not skipped, and it still says which way the calendar went.
    rerender(at(5))
    expect(band()?.style.transform).toBe("translateX(-30%)")
    rerender(at(-3))
    expect(band()?.style.transform).toBe("translateX(-110%)")
  })

  test("the band travels on the house curve for things that move", () => {
    // `ease-out` starts at full speed, which is right for something arriving
    // from off screen and wrong for a band that starts from rest in front of
    // the reader. See `--ease-quebi-travel` in the theme.
    const { container } = view({ range: { months: 2, carousel: true } })
    const band = container.querySelector<HTMLElement>('[data-slot="month-band"]')
    expect(band?.className).toContain("ease-quebi-travel")
    expect(band?.className).toContain("duration-400")
    expect(band?.className).toContain("motion-reduce:transition-none")

    // The cells widen on the same curve: when the count changes they resize
    // while the band slides under them, and two curves would read as two
    // events rather than one movement.
    const cell = container.querySelector<HTMLElement>('[data-slot="month-band"] > div')
    expect(cell?.className).toContain("ease-quebi-travel")
    expect(cell?.className).toContain("duration-400")
  })
})
