/**
 * CalendarTimeline's multi-day axis (task #167).
 *
 * `tests/components/calendar-views.test.tsx` covers what the timeline shares
 * with the three grid views; this file covers what only it has.
 *
 * Every render is given an explicit `locale`, `timeZone`, date and `now`, so
 * nothing here depends on the machine running it.
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
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CalendarSource } from "../../src/components/calendar-shell"
import { CalendarTimeline } from "../../src/components/calendar-timeline"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture week, same as the packing suite. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), ZONE)

const CALENDARS: CalendarSource[] = [
  { id: "me", name: "My calendar", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
]

/** Every rendered bar, keyed by the event id it carries. */
function blocks(container: HTMLElement, slot = "calendar-bar") {
  return new Map(
    Array.from(container.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)).map((node) => [
      node.dataset.eventId ?? "",
      node,
    ]),
  )
}

/** Every rendered bar in document order — multi-day events produce several. */
const barList = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-slot="calendar-bar"]'))

/**
 * The axis over more than one day (task #167).
 *
 * The component was hardcoded to a single day in five places, of which `toLeft`
 * was the load-bearing one: it mapped clock minutes to pixels with no notion of
 * *which* day, so `DaySegment.dayIndex` was read nowhere and Tuesday's 09:00
 * would have drawn on top of Monday's. These assertions are on `left` and `top`
 * in pixels because the geometry is the thing that was missing.
 *
 * A ten-hour window at 60px an hour makes every day exactly 600px, so the
 * arithmetic below is readable rather than incidental.
 */
describe("CalendarTimeline over a span", () => {
  const span = (extra: Partial<React.ComponentProps<typeof CalendarTimeline>> = {}) =>
    render(
      <CalendarTimeline
        date={MONDAY}
        calendars={CALENDARS.slice(0, 1)}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        startHour={8}
        endHour={18}
        hourWidth={60}
        {...extra}
      />,
    )

  test("the header is two rows: a day label per day, and hour ticks beneath", () => {
    const { container } = span({ days: 3 })
    expect(container.querySelectorAll('[data-slot="calendar-day-label"]')).toHaveLength(3)
    expect(container.querySelector('[data-slot="calendar-hour-row"]')).not.toBeNull()
  })

  test("thirty days drops the hour row and reads as a day axis", () => {
    const { container } = render(
      <CalendarTimeline
        date={MONDAY}
        days={30}
        calendars={CALENDARS.slice(0, 1)}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    expect(container.querySelectorAll('[data-slot="calendar-day-label"]')).toHaveLength(30)
    // At the default 8px an hour a day is 128px — too narrow for hours to be the
    // unit anyone reads, so the day row is the axis.
    expect(container.querySelector('[data-slot="calendar-hour-row"]')).toBeNull()
  })

  test("the same clock minute is a different place on every day", () => {
    const { container } = span({
      days: 3,
      events: [
        { id: "d0", title: "Kickoff", start: at(MONDAY, 10), end: at(MONDAY, 11), calendarId: "me" },
        {
          id: "d2",
          title: "Retro",
          start: at(MONDAY.add({ days: 2 }), 10),
          end: at(MONDAY.add({ days: 2 }), 11),
          calendarId: "me",
        },
      ],
    })
    const bars = blocks(container, "calendar-bar")
    // 10:00 is two hours into a ten-hour day drawn 600px wide.
    expect(bars.get("d0")?.style.left).toBe("120px")
    expect(bars.get("d2")?.style.left).toBe("1320px")
  })

  test("packing is on window minutes, so the day seam is not a false clash", () => {
    const { container } = span({
      days: 3,
      events: [
        // 16:00–18:00 on Monday and 17:00–19:00 on Tuesday overlap as *clock*
        // minutes and not at all in reality. Packed on the clock they would be
        // pushed into two lanes and the row would claim a double booking.
        { id: "mon", title: "Late session", start: at(MONDAY, 16), end: at(MONDAY, 18), calendarId: "me" },
        {
          id: "tue",
          title: "Evening call",
          start: at(MONDAY.add({ days: 1 }), 17),
          end: at(MONDAY.add({ days: 1 }), 19),
          calendarId: "me",
        },
      ],
    })
    const bars = blocks(container, "calendar-bar")
    expect(bars.get("mon")?.style.top).toBe("4px")
    expect(bars.get("tue")?.style.top).toBe("4px")
  })

  test("a real clash on one day still grows a second lane", () => {
    const { container } = span({
      days: 3,
      events: [
        { id: "a", title: "Planning", start: at(MONDAY, 10), end: at(MONDAY, 12), calendarId: "me" },
        { id: "b", title: "Board call", start: at(MONDAY, 11), end: at(MONDAY, 13), calendarId: "me" },
      ],
    })
    const bars = blocks(container, "calendar-bar")
    expect(bars.get("a")?.style.top).toBe("4px")
    expect(bars.get("b")?.style.top).toBe("34px")
  })

  test("an all-day event is a band across the days it covers, not the whole axis", () => {
    const { container } = span({
      days: 7,
      events: [
        {
          id: "offsite",
          title: "Research offsite",
          start: at(MONDAY.add({ days: 2 }), 0),
          end: at(MONDAY.add({ days: 5 }), 0),
          allDay: true,
          calendarId: "me",
        },
      ],
    })
    const bar = blocks(container, "calendar-bar").get("offsite")
    // Days 2 through 4 inclusive: from the start of day 2 to the end of day 4.
    expect(bar?.style.left).toBe("1200px")
    expect(bar?.style.width).toBe("1798px")
    expect(bar?.textContent).toContain("Research offsite")
  })

  test("an event through midnight is one segment per day, cut at each edge", () => {
    const { container } = span({
      days: 2,
      events: [
        {
          id: "night",
          title: "Night shift",
          start: at(MONDAY, 16),
          end: at(MONDAY.add({ days: 1 }), 9),
          calendarId: "me",
        },
      ],
    })
    const bars = barList(container)
    expect(bars).toHaveLength(2)
    // Monday 16:00 to the 18:00 edge, then the 08:00 edge to Tuesday 09:00. The
    // fourteen undrawn night hours between them take no pixels — the window says
    // they are not on the axis, so the seam is the day boundary itself.
    expect(bars[0]?.style.left).toBe("480px")
    expect(bars[0]?.style.width).toBe("118px")
    expect(bars[0]?.className).toContain("rounded-r-none")
    expect(bars[1]?.style.left).toBe("600px")
    expect(bars[1]?.style.width).toBe("58px")
    expect(bars[1]?.className).toContain("rounded-l-none")
  })

  test("no hour tick is drawn without room before the next one or the day's edge", () => {
    const { container } = render(
      <CalendarTimeline
        date={MONDAY}
        days={7}
        calendars={CALENDARS.slice(0, 1)}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const lefts = Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="calendar-hour-row"] span'),
    ).map((tick) => Number.parseFloat(tick.style.left))
    expect(lefts.length).toBeGreaterThan(0)

    // A week defaults to 20px an hour, so the step lands on three hours. The
    // 6–22 window would end on a 21:00 tick with one hour — 20px — before the
    // next day's 06:00, and the two labels printed over each other; the last
    // tick of each day is 18:00 for that reason.
    const gaps = lefts.slice(1).map((left, index) => left - (lefts[index] ?? 0))
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(48)
  })

  test("the now-marker appears anywhere inside the range, not only on day one", () => {
    const { container } = span({ days: 7, now: at(MONDAY.add({ days: 3 }), 12) })
    const marker = container.querySelector<HTMLElement>('[data-slot="calendar-now-marker"]')
    // Three whole days, then four hours into the fourth.
    expect(marker?.style.left).toBe("2040px")
  })

  test("and not at all when the instant falls outside the range", () => {
    const { container } = span({ days: 7, now: at(MONDAY.add({ days: 9 }), 12) })
    expect(container.querySelector('[data-slot="calendar-now-marker"]')).toBeNull()
  })

  test("a chevron pages the whole span", async () => {
    const seen: CalendarDate[] = []
    span({ days: 3, onDateChange: (next: CalendarDate) => seen.push(next) })
    await userEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(seen[0]?.toString()).toBe(MONDAY.add({ days: 3 }).toString())
  })
})
