/**
 * What MiniMonth promises beyond the pixels: dots per calendar rather than
 * per event, a band behind a span that breaks at the week's edge, today and
 * the picked day as data a test (and a stylesheet) can find, the page-turn
 * reported as a month rather than as every focus move, and the dots said in
 * words for anyone who cannot see them.
 *
 * Dates are pinned to September 2026, and `now` is passed, so the run does not
 * depend on the day it happens on.
 */
import { CalendarDate, Time, toCalendarDateTime, toZoned } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CalendarEvent, CalendarSource } from "../../src/components/calendar-shell"
import { markDays, MiniMonth, type MiniMonthSpan } from "../../src/components/mini-month"

const TZ = "Europe/Berlin"
const SEPT = new CalendarDate(2026, 9, 1)
const at = (day: number, hour: number) =>
  toZoned(toCalendarDateTime(SEPT.set({ day }), new Time(hour)), TZ)

const CALENDARS: CalendarSource[] = [
  { id: "visits", name: "Appointments", color: "brand" },
  { id: "shifts", name: "Shifts", color: "orange" },
]

const EVENTS: CalendarEvent[] = [
  { id: "a", title: "Check-up", start: at(9, 8), end: at(9, 9), calendarId: "visits" },
  { id: "b", title: "Home visit", start: at(9, 11), end: at(9, 12), calendarId: "visits" },
  { id: "c", title: "Early shift", start: at(9, 7), end: at(9, 19), calendarId: "shifts" },
  { id: "d", title: "Night shift", start: at(10, 22), end: at(11, 6), calendarId: "shifts" },
]

const SPANS: MiniMonthSpan[] = [
  // Friday 11th to Tuesday 15th: crosses the Sunday/Monday week edge.
  { id: "leave", title: "Absence", start: SEPT.set({ day: 11 }), end: SEPT.set({ day: 15 }) },
]

/** The cell drawing `day` of the visible September, found by the number it shows. */
const cell = (day: number) => {
  const found = screen
    .getAllByRole("button")
    .find((button) => button.firstElementChild?.textContent === String(day))
  if (!found) throw new Error(`no cell for ${day}`)
  return found
}

const dots = (element: HTMLElement) =>
  element.querySelectorAll('[aria-hidden="true"] > span').length

const renderMonth = (props: Partial<Parameters<typeof MiniMonth>[0]> = {}) =>
  render(
    <MiniMonth
      aria-label="Your month"
      events={EVENTS}
      calendars={CALENDARS}
      spans={SPANS}
      defaultMonth={SEPT}
      now={SEPT.set({ day: 23 })}
      timeZone={TZ}
      firstDayOfWeek="mon"
      {...props}
    />,
  )

describe("markDays", () => {
  test("one colour per calendar, in the order the calendars are listed", () => {
    const marks = markDays(EVENTS, CALENDARS, TZ)
    expect(marks.get("2026-09-09")?.colors).toEqual(["brand", "orange"])
    expect(marks.get("2026-09-09")?.titles).toEqual(["Early shift", "Check-up", "Home visit"])
  })

  test("an event past midnight marks both days, and an exclusive end marks neither extra", () => {
    const marks = markDays(EVENTS, CALENDARS, TZ)
    expect(marks.has("2026-09-10")).toBe(true)
    expect(marks.has("2026-09-11")).toBe(true)
    expect(marks.has("2026-09-12")).toBe(false)
  })
})

describe("MiniMonth", () => {
  test("draws a dot per calendar, not per event", () => {
    renderMonth()
    expect(dots(cell(9))).toBe(2)
    expect(dots(cell(10))).toBe(1)
    expect(dots(cell(2))).toBe(0)
  })

  test("maxDots caps the row", () => {
    renderMonth({ maxDots: 1 })
    expect(dots(cell(9))).toBe(1)
  })

  test("a span bands every day it covers and breaks at the week edge", () => {
    renderMonth()
    for (const day of [11, 12, 13, 14, 15]) expect(cell(day).dataset.span).toBe("leave")
    expect(cell(10).dataset.span).toBeUndefined()
    expect(cell(16).dataset.span).toBeUndefined()
    // Sunday 13th closes the first week's run, Monday 14th opens the next.
    expect(cell(13).className).toContain("rounded-e-")
    expect(cell(14).className).toContain("rounded-s-")
    expect(cell(12).className).not.toMatch(/rounded-(s|e)-/)
  })

  test("marks today only when told what today is", () => {
    const { unmount } = renderMonth()
    expect(cell(23).dataset.currentDay).toBe("true")
    unmount()
    renderMonth({ now: null })
    expect(cell(23).dataset.currentDay).toBeUndefined()
  })

  test("picking a day reports it", async () => {
    const picked: string[] = []
    renderMonth({ onDayChange: (day) => picked.push(day.toString()) })
    await userEvent.click(cell(17))
    expect(picked).toEqual(["2026-09-17"])
  })

  test("paging reports the new month once, as its first day", async () => {
    const months: string[] = []
    renderMonth({ onMonthChange: (month) => months.push(month.toString()) })
    await userEvent.click(screen.getByRole("button", { name: "Next month" }))
    expect(months).toEqual(["2026-10-01"])
  })

  test("describes the marked days in words, for the visible month only", () => {
    renderMonth({
      events: [
        ...EVENTS,
        { id: "z", title: "Next month", start: at(9, 8).add({ months: 1 }), end: at(9, 9).add({ months: 1 }) },
      ],
    })
    const grid = screen.getByRole("application")
    const summary = document.getElementById(grid.getAttribute("aria-describedby") ?? "")
    expect(summary?.textContent).toMatch(/9\S*: Early shift, Check-up, Home visit\./)
    expect(summary?.textContent).toMatch(/11\b.* – .*\b15\b.*: Absence\./)
    expect(summary?.textContent).not.toContain("Next month")
  })

  test("two months draw two grids", () => {
    renderMonth({ months: 2 })
    expect(screen.getAllByRole("grid")).toHaveLength(2)
  })
})
