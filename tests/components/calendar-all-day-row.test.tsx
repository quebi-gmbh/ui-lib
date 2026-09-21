/**
 * Whether the all-day row is there at all.
 *
 * The band itself — its lanes, its clipping at the week boundary and its
 * "+N more" — is `calendar-packing.test.ts` and
 * `calendar-overflow-panel.test.tsx`. This file is about the row the band sits
 * in, which for a calendar with no all-day events was 28px of empty strip, a
 * gutter label and a hairline above every grid the library drew.
 *
 * `showAllDayRow` defaults to `"auto"`, and the whole question is which set it
 * asks. Asked of the visible days, the row would come and go as the reader
 * paged, moving the grid under them on the step where a holiday scrolled out of
 * range — worse than the empty strip it removed. Asked of `events`, it is a
 * fact about the calendar: reserved from the first render for a calendar that
 * has all-day events, empty weeks included, and never drawn for one that has
 * none. `true` is the escape hatch for a view fed one page at a time, where the
 * events in hand are not the calendar.
 */
import { describe, expect, test } from "bun:test"
import {
  type CalendarDate,
  parseZonedDateTime,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date"
import { render } from "@testing-library/react"
import type { CalendarEvent } from "../../src/components/calendar-shell"
import { DayView } from "../../src/components/day-view"
import { WeekView } from "../../src/components/week-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture week, same as the packing suite. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), ZONE)

const TIMED: CalendarEvent[] = [
  { id: "standup", title: "Standup", start: at(MONDAY, 9), end: at(MONDAY, 9, 15) },
  { id: "retro", title: "Retro", start: at(MONDAY, 14), end: at(MONDAY, 15) },
]

/** 22:00–06:00 is eight hours: a night shift belongs on the grid, cut at midnight. */
const OVERNIGHT: CalendarEvent = {
  id: "oncall",
  title: "On call",
  start: at(MONDAY, 22),
  end: at(MONDAY.add({ days: 1 }), 6),
}

const HOLIDAY: CalendarEvent = {
  id: "holiday",
  title: "Public holiday",
  start: at(MONDAY, 0),
  end: at(MONDAY.add({ days: 1 }), 0),
  allDay: true,
}

const row = (container: HTMLElement) =>
  container.querySelector('[data-slot="calendar-all-day-row"]')

const day = (extra: Partial<React.ComponentProps<typeof DayView>> = {}) =>
  render(<DayView date={MONDAY} events={TIMED} locale={LOCALE} timeZone={ZONE} now={null} {...extra} />)

describe("the all-day row", () => {
  test("is not drawn for a calendar whose events are all timed", () => {
    expect(row(day().container)).toBeNull()
    // Not a flag lookup: `isAllDayEvent` is the absolute-duration test, so an
    // overnight shift is still a grid event and still earns no row.
    expect(row(day({ events: [...TIMED, OVERNIGHT] }).container)).toBeNull()
  })

  test("is drawn as soon as one event belongs in it", () => {
    expect(row(day({ events: [...TIMED, HOLIDAY] }).container)).not.toBeNull()
  })

  test("stays put on a day the band is empty on", () => {
    // Tuesday holds nothing all-day, and the row is there anyway — otherwise
    // stepping from Monday to Tuesday would lift the grid by 28px.
    const { container } = day({ date: MONDAY.add({ days: 1 }), events: [...TIMED, HOLIDAY] })
    expect(row(container)).not.toBeNull()
    expect(container.querySelectorAll('[data-slot="calendar-band"]')).toHaveLength(0)
  })

  test("`true` reserves it regardless, `false` never draws it", () => {
    expect(row(day({ showAllDayRow: true }).container)).not.toBeNull()
    expect(row(day({ events: [...TIMED, HOLIDAY], showAllDayRow: false }).container)).toBeNull()
  })

  test("the week is the same calendar, asked the same way", () => {
    const week = (events: CalendarEvent[]) =>
      render(
        <WeekView date={MONDAY} events={events} locale={LOCALE} timeZone={ZONE} now={null} />,
      ).container
    expect(row(week(TIMED))).toBeNull()
    expect(row(week([...TIMED, HOLIDAY]))).not.toBeNull()
  })
})
