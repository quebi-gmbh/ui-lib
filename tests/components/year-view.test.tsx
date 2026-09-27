/**
 * What YearView promises beyond the pixels: a day with something on it is a
 * link named in words, an empty day is not in the accessibility tree at all,
 * the heatmap's steps land where `heatmapLevel` says (and a quiet year is not
 * painted full), the aggregate feed replaces the event feed, the 1st lands in
 * the locale's column, and "+N more" opens the whole day.
 *
 * Everything is pinned to 2026 with `now` passed, so the run does not depend on
 * the day it happens on.
 */
import { CalendarDate, Time, toCalendarDateTime, toZoned } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CalendarEvent } from "../../src/components/calendar-shell"
import { eventsByDay, heatmapLevel, YearView } from "../../src/components/year-view"

const TZ = "Europe/Berlin"
const SEPT = new CalendarDate(2026, 9, 1)
const at = (day: number, hour: number) =>
  toZoned(toCalendarDateTime(SEPT.set({ day }), new Time(hour)), TZ)

const event = (id: string, day: number, hour = 9, title = id): CalendarEvent => ({
  id,
  title,
  start: at(day, hour),
  end: at(day, hour + 1),
})

/** One event on the 7th, two on the 8th, five on the 10th. */
const EVENTS: CalendarEvent[] = [
  event("a", 7),
  event("b", 8, 9),
  event("c", 8, 11),
  ...[8, 9, 10, 11, 12].map((hour) => event(`d${hour}`, 10, hour, `Visit ${hour}`)),
]

const renderYear = (props: Partial<Parameters<typeof YearView>[0]> = {}) =>
  render(
    <YearView
      events={EVENTS}
      date={SEPT}
      now={SEPT.set({ day: 23 })}
      timeZone={TZ}
      locale="en-GB"
      showToolbar={false}
      dayHref={(day) => `/calendar/day/${day}`}
      monthHref={(month) => `/calendar/month/${month}`}
      {...props}
    />,
  )

const dayCell = (iso: string) => {
  const found = document.querySelector<HTMLElement>(`[data-slot="year-view-day"][data-date="${iso}"]`)
  if (!found) throw new Error(`no cell for ${iso}`)
  return found
}

describe("heatmapLevel", () => {
  test("empty is 0 and only empty", () => {
    expect(heatmapLevel(0, 0)).toBe(0)
    expect(heatmapLevel(0, 10)).toBe(0)
    expect(heatmapLevel(1, 100)).toBe(1)
  })

  test("a year whose busiest day has one event is not painted full", () => {
    expect(heatmapLevel(1, 1)).toBe(1)
  })

  test("the scale never runs below four, so a step is at least one event", () => {
    expect([1, 2].map((count) => heatmapLevel(count, 2))).toEqual([1, 2])
    expect([1, 2, 3, 4].map((count) => heatmapLevel(count, 4))).toEqual([1, 2, 3, 4])
  })

  test("above four, the busiest day is full and the steps split the range evenly", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((count) => heatmapLevel(count, 8))).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4,
    ])
  })

  test("a count past a pinned scale is the top step, not a fifth", () => {
    expect(heatmapLevel(40, 8)).toBe(4)
  })
})

describe("eventsByDay", () => {
  test("an event past midnight counts on both days; an exclusive end adds none", () => {
    const night: CalendarEvent = { id: "n", title: "Night", start: at(3, 22), end: at(4, 6) }
    const byDay = eventsByDay([night, event("x", 5)], SEPT, TZ)
    expect(byDay.get("2026-09-03")?.map((e) => e.id)).toEqual(["n"])
    expect(byDay.get("2026-09-04")?.map((e) => e.id)).toEqual(["n"])
    expect(byDay.has("2026-09-06")).toBe(false)
  })

  test("only the year asked for", () => {
    const next = { ...event("y", 7), start: at(7, 9).add({ years: 1 }), end: at(7, 10).add({ years: 1 }) }
    expect(eventsByDay([next], SEPT, TZ).size).toBe(0)
  })
})

describe("YearView", () => {
  test("draws twelve month cards, each a region named by its heading", () => {
    renderYear()
    const regions = screen.getAllByRole("region")
    expect(regions).toHaveLength(12)
    expect(screen.getByRole("region", { name: "September" })).toBeInTheDocument()
  })

  test("the month heading links to the month", () => {
    renderYear()
    const september = screen.getByRole("region", { name: "September" })
    expect(within(september).getByRole("link", { name: "September" })).toHaveAttribute(
      "href",
      "/calendar/month/2026-09-01",
    )
  })

  test("a day with events is a link named by its count and date", () => {
    renderYear()
    const one = screen.getByRole("link", { name: /^1 event on Mon.* 7 Sep.* 2026$/ })
    expect(one).toHaveAttribute("href", "/calendar/day/2026-09-07")
    expect(screen.getByRole("link", { name: /^2 events on Tue.* 8 Sep.* 2026$/ })).toBeInTheDocument()
  })

  test("an empty day is inert and hidden from assistive tech", () => {
    renderYear()
    const empty = dayCell("2026-09-09")
    expect(empty.tagName).toBe("SPAN")
    expect(empty).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByRole("link", { name: /on Wed.* 9 Sep/ })).toBeNull()
  })

  test("without a target a busy day is text, still named in words", () => {
    renderYear({ dayHref: undefined })
    expect(screen.queryByRole("link", { name: /event/ })).toBeNull()
    expect(dayCell("2026-09-07")).toHaveTextContent(/1 event on/)
  })

  test("onDayAction receives the day and everything on it", async () => {
    const pressed: string[] = []
    renderYear({
      dayHref: undefined,
      onDayAction: (day, events) => pressed.push(`${day}:${events.length}`),
    })
    await userEvent.click(screen.getByRole("link", { name: /^2 events on/ }))
    expect(pressed).toEqual(["2026-09-08:2"])
  })

  test("heatmap steps follow the year's busiest day", () => {
    renderYear()
    // Busiest day holds five: 1 → 1, 2 → 2, 5 → 4.
    expect(dayCell("2026-09-07").dataset.level).toBe("1")
    expect(dayCell("2026-09-08").dataset.level).toBe("2")
    expect(dayCell("2026-09-10").dataset.level).toBe("4")
  })

  test("a year of single events stays at the first step", () => {
    renderYear({ events: [event("a", 7), event("b", 14)] })
    expect(dayCell("2026-09-07").dataset.level).toBe("1")
    expect(dayCell("2026-09-14").dataset.level).toBe("1")
  })

  test("the legend states the scale, and drops it for an empty year", () => {
    const { unmount } = renderYear()
    expect(screen.getByText("(up to 5 in a day)")).toBeInTheDocument()
    unmount()
    renderYear({ events: [] })
    expect(screen.queryByText(/up to/)).toBeNull()
    expect(screen.queryAllByRole("link", { name: /event/ })).toHaveLength(0)
  })

  test("counts replace events for counting", () => {
    renderYear({ variant: "count", counts: { "2026-09-15": 12, "2027-01-01": 99 } })
    expect(screen.getByRole("link", { name: /^12 events on Tue.* 15 Sep/ })).toBeInTheDocument()
    // The event feed is not read alongside it.
    expect(screen.queryByRole("link", { name: /on Mon.* 7 Sep/ })).toBeNull()
    expect(dayCell("2026-09-15")).toHaveTextContent("12")
  })

  test("the heatmap scales a counts feed against its own year only", () => {
    renderYear({ counts: { "2026-09-15": 8, "2026-09-16": 2, "2027-01-01": 99 } })
    expect(dayCell("2026-09-15").dataset.level).toBe("4")
    expect(dayCell("2026-09-16").dataset.level).toBe("1")
  })

  test("the 1st lands in the locale's column", () => {
    // 1 September 2026 is a Tuesday: one blank before it on a Monday-first
    // week, two on a Sunday-first one.
    const blanks = () => {
      const september = screen.getByRole("region", { name: "September" })
      const first = dayCell("2026-09-01")
      const cells = Array.from(first.parentElement?.children ?? [])
      expect(september.contains(first)).toBe(true)
      return cells.indexOf(first) - 7
    }
    const { unmount } = renderYear()
    expect(blanks()).toBe(1)
    unmount()
    renderYear({ locale: "en-US" })
    expect(blanks()).toBe(2)
  })

  test("today is marked only when told what today is", () => {
    const { unmount } = renderYear()
    expect(dayCell("2026-09-23").dataset.currentDay).toBe("true")
    unmount()
    renderYear({ now: null })
    expect(dayCell("2026-09-23").dataset.currentDay).toBeUndefined()
  })

  test("list: the first maxItems titles, then +N more opening the whole day", async () => {
    renderYear({ variant: "list", maxItems: 2 })
    const day = dayCell("2026-09-10")
    expect(within(day).getAllByText(/^Visit/)).toHaveLength(2)
    await userEvent.click(within(day).getByRole("button", { name: "+3 more" }))
    const panel = await screen.findByRole("dialog")
    for (const hour of [8, 9, 10, 11, 12]) {
      expect(within(panel).getByText(`Visit ${hour}`)).toBeInTheDocument()
    }
  })

  test("list: onMoreClick takes the press over", async () => {
    const pressed: string[] = []
    renderYear({
      variant: "list",
      maxItems: 1,
      onMoreClick: (day, events) => pressed.push(`${day}:${events.length}`),
    })
    await userEvent.click(within(dayCell("2026-09-10")).getByRole("button", { name: "+4 more" }))
    expect(pressed).toEqual(["2026-09-10:5"])
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  test("months draws a subset in the order given", () => {
    renderYear({ months: [11, 9, 10] })
    expect(screen.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
      "November",
      "September",
      "October",
    ])
  })
})
