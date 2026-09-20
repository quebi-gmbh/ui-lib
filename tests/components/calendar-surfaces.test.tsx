/**
 * What the calendar views paint, as opposed to what they lay out.
 *
 * `tests/components/calendar-views.test.tsx` covers the geometry and says, in
 * its header, that its assertions are on text rather than on classes — because
 * colour is never the only channel there, and pinning a hue would pin the wrong
 * thing. This file is the deliberate exception: three reported defects
 * (tasks #165, #168 and #176) were *about* the classes, so the classes are what
 * has to be pinned, and keeping them here leaves that policy intact next door.
 *
 * Each suite pins the shape of the fix rather than an exact utility string
 * wherever it can, so restyling stays cheap and regressing does not.
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
import {
  CALENDAR_COLORS,
  type CalendarEvent,
  type CalendarSource,
} from "../../src/components/calendar-shell"
import { DayView } from "../../src/components/day-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture week, same as the packing suite. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), ZONE)

const CALENDARS: CalendarSource[] = [{ id: "me", name: "My calendar", color: "blue" }]

const EVENT: CalendarEvent = {
  id: "one",
  title: "Workshop",
  start: at(MONDAY, 9, 30),
  end: at(MONDAY, 11),
  calendarId: "me",
}

const blockFor = (container: HTMLElement, id = "one") =>
  container.querySelector<HTMLElement>(`[data-slot="calendar-event"][data-event-id="${id}"]`)

/**
 * The wash is a colour, not a transparency (task #165).
 *
 * A tint written `bg-blue-500/15` leaves the bar 85% transparent, so the hour
 * lines, the sub-slot lines and the column rules the grid draws *underneath* an
 * event stay legible straight through it — which is what was reported. The fix
 * is the same apparent colour composited against the page at token level, so
 * what is pinned is the *shape* of the value: a `color-mix` against
 * `--color-quebi-bg`, and no alpha suffix left in any fill.
 */
describe("the calendar palette is opaque", () => {
  const entries = Object.entries(CALENDAR_COLORS)

  test("every fill is a color-mix against the page, not an alpha", () => {
    expect(entries.length).toBeGreaterThan(0)
    for (const [name, palette] of entries) {
      for (const [field, value] of [
        ["block", palette.block],
        ["band", palette.band],
      ] as const) {
        const where = `${name}.${field}: ${value}`
        // `bg-blue-500/15`, `hover:bg-quebi-brand/25` — the reported shape.
        expect(where).not.toMatch(/bg-[\w-]+\/[\d.]+/)
        expect(where).toContain("color-mix(in_oklab,")
        expect(where).toContain("var(--color-quebi-bg)")
      }
    }
  })

  test("the hover tint stays stronger than the resting one, as it was at 15/25", () => {
    for (const [name, palette] of entries) {
      expect([name, palette.block.match(/_(\d+)%,/g)]).toEqual([name, ["_15%,", "_25%,"]])
      expect([name, palette.band.match(/_(\d+)%,/g)]).toEqual([name, ["_20%,"]])
    }
  })

  test("the solid edge and dot keep the raw hue — only the fill composites", () => {
    for (const [name, palette] of entries) {
      expect([name, palette.edge.includes("color-mix")]).toEqual([name, false])
      expect([name, palette.dot.includes("color-mix")]).toEqual([name, false])
    }
  })

  test("a rendered block carries the opaque tint, so nothing shows through it", () => {
    const { container } = render(
      <DayView
        date={MONDAY}
        calendars={CALENDARS}
        events={[EVENT]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    expect(blockFor(container)?.className).toContain(CALENDAR_COLORS.blue.block)
  })
})
