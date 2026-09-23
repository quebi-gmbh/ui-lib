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
  /** The band's cells, in order: the month they draw, and whether they peek. */
  const cells = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="month-carousel"] > div > div'),
    ).map((cell) => ({
      basis: cell.style.flexBasis,
      peeking: cell.hasAttribute("inert"),
      blurred: cell.className.includes("blur-xs"),
    }))

  test("draws one month more at each end than it shows, and makes them inert", () => {
    const { container } = view({ range: { months: 2, carousel: true } })

    // Two months in the window, one peeking at each end: four grids drawn.
    const band = cells(container)
    expect(band).toHaveLength(4)
    expect(band.map((cell) => cell.peeking)).toEqual([true, false, false, true])
    expect(band.map((cell) => cell.blurred)).toEqual([true, false, false, true])
    expect(container.querySelectorAll('[data-slot="month-grid"]')).toHaveLength(4)

    // The heading names the window, not the band: August and November are
    // drawn, but nobody is looking at them yet.
    expect(screen.getByText("September–Oktober 2026")).toBeInTheDocument()
  })

  test("is laid out in percentages of the window, peek included", () => {
    // Two months and a quarter of a month at each end is 2.5 cells across, so
    // a cell is 40% of the window; sliding the band by all but the peek of one
    // cell — 75% of 40% — puts September at the window's left edge.
    const { container } = view({ range: { months: 2, carousel: { peek: 0.25 } } })
    expect(cells(container)[0]?.basis).toBe("40%")

    const track = container.querySelector<HTMLElement>('[data-slot="month-carousel"] > div')
    expect(track?.style.transform).toBe("translateX(-30%)")
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
    // Three in the window and one peeking either side: five grids, each a
    // fifth narrower than before.
    expect(cells(container)).toHaveLength(5)
    expect(screen.getByText("September–November 2026")).toBeInTheDocument()
  })

  test("an empty choice list is the carousel with the reader's half turned off", () => {
    const { container } = view({ range: { months: 2, carousel: { choices: [] } } })

    expect(screen.queryByRole("radiogroup", { name: "Months shown" })).toBeNull()
    expect(cells(container)).toHaveLength(4)
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
