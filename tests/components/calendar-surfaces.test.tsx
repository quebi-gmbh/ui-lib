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
import { MonthView } from "../../src/components/month-view"
import { WeekView } from "../../src/components/week-view"

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

const ALL_DAY: CalendarEvent = {
  id: "trip",
  title: "Conference",
  start: at(MONDAY, 0),
  end: at(MONDAY.add({ days: 2 }), 0),
  allDay: true,
  calendarId: "me",
}

const slot = (container: HTMLElement, name: string, id: string) =>
  container.querySelector<HTMLElement>(`[data-slot="${name}"][data-event-id="${id}"]`)

const blockFor = (container: HTMLElement, id = "one") => slot(container, "calendar-event", id)

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

/**
 * Selection is the event's own hue; focus stays the brand's (task #168).
 *
 * All three views drew selection as `ring-2 ring-quebi-brand-mark ring-inset` —
 * byte for byte the focus treatment on the line above it. That was three
 * defects in one: teal argued with whatever hue the event was painted in, the
 * *inset* ring landed exactly on the 2px `edge` and erased the only mark of
 * which calendar the event belonged to, and a merely focused event was
 * indistinguishable from a selected one.
 *
 * What is pinned: selection and focus never share a treatment, selection comes
 * from the palette, and the accent survives it.
 */
describe("selection is drawn in the event's own colour", () => {
  const entries = Object.entries(CALENDAR_COLORS)

  test("every palette entry carries a selection colour", () => {
    for (const [name, palette] of entries) {
      expect([name, typeof palette.selected]).toEqual([name, "string"])
      expect([name, palette.selected.startsWith("outline-")]).toEqual([name, true])
    }
  })

  test("the selection colour is the entry's own hue, not a second colour system", () => {
    for (const [name, palette] of entries) {
      const hue = palette.edge.replace("border-l-", "")
      expect([name, palette.selected]).toEqual([name, `outline-${hue}`])
    }
  })

  test("only the brand entry may wear the brand mark", () => {
    for (const [name, palette] of entries) {
      expect([name, palette.selected.includes("quebi-brand")]).toEqual([name, name === "brand"])
    }
    expect(CALENDAR_COLORS.brand.selected).toBe("outline-quebi-brand-mark")
  })

  test("a selected block differs from a focused one, and keeps its accent", () => {
    const { container } = render(
      <DayView
        date={MONDAY}
        calendars={CALENDARS}
        events={[EVENT]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        selectedEventId="one"
      />,
    )
    const className = blockFor(container)?.className ?? ""

    expect(className).toContain("outline-2")
    expect(className).toContain(CALENDAR_COLORS.blue.selected)
    // `outline-solid` is what displaces the base `outline-none`; without it the
    // outline has a width and no style, and so paints nothing at all.
    expect(className).toContain("outline-solid")
    expect(className).not.toContain("outline-none")

    // Focus is still the brand mark, and still only under focus-visible.
    expect(className).toContain("focus-visible:ring-quebi-brand-mark")
    expect(className.split(" ")).not.toContain("ring-2")

    // The left accent is no longer overpainted by an inset ring.
    expect(className).toContain("border-l-2")
    expect(className).toContain(CALENDAR_COLORS.blue.edge)
  })

  test("an unselected block has no outline at all", () => {
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
    const className = blockFor(container)?.className ?? ""
    expect(className).toContain("outline-none")
    expect(className).not.toContain("outline-2")
  })

  test("the month chip and the week all-day band select the same way", () => {
    const month = render(
      <MonthView
        date={MONDAY}
        calendars={CALENDARS}
        events={[ALL_DAY]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        selectedEventId="trip"
      />,
    )
    const chip = slot(month.container, "calendar-chip", "trip")?.className ?? ""
    expect(chip).toContain("outline-2")
    expect(chip).toContain(CALENDAR_COLORS.blue.selected)
    month.unmount()

    const week = render(
      <WeekView
        date={MONDAY}
        calendars={CALENDARS}
        events={[ALL_DAY]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        selectedEventId="trip"
      />,
    )
    const band = slot(week.container, "calendar-band", "trip")?.className ?? ""
    expect(band).toContain("outline-2")
    expect(band).toContain(CALENDAR_COLORS.blue.selected)
  })
})

/**
 * The accented edge is never rounded (task #176).
 *
 * `--radius-quebi-sm` is 8px and both the month chip and the week all-day band
 * are 20px tall, so two corners consume 16px of the 20 and the 2px `edge` is
 * forced round them — its inner radius is `outer - width`, so the stroke tapers
 * as it turns and the series line reads as a crescent hooked into a pill rather
 * than as a straight bar. `TimedBlock` already rounds only its trailing corners
 * and leaves its accent dead straight; these two were the outliers, and the
 * shortest surfaces, where it showed most.
 */
describe("the colour accent is a straight line, not a crescent", () => {
  const chipFor = (container: HTMLElement, id: string) => slot(container, "calendar-chip", id)

  test("a filled month chip is square on the accented edge and round on the other", () => {
    const { container } = render(
      <MonthView
        date={MONDAY}
        calendars={CALENDARS}
        events={[ALL_DAY]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const className = chipFor(container, "trip")?.className ?? ""
    expect(className).toContain("rounded-l-none")
    expect(className).not.toContain("rounded-l-quebi-sm")
    // The trailing edge keeps the radius: only the accent is straightened.
    expect(className).toContain("rounded-r-quebi-sm")
    // And it is the accent that makes the difference.
    expect(className).toContain("border-l-2")
    expect(className).toContain(CALENDAR_COLORS.blue.edge)
  })

  test("a timed month chip has no accent, so it keeps both corners", () => {
    const { container } = render(
      <MonthView
        date={MONDAY}
        calendars={CALENDARS}
        events={[EVENT]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const className = chipFor(container, "one")?.className ?? ""
    expect(className).not.toContain("border-l-2")
    expect(className).toContain("rounded-l-quebi-sm")
    expect(className).toContain("rounded-r-quebi-sm")
  })

  test("the week all-day band gets the same treatment", () => {
    const { container } = render(
      <WeekView
        date={MONDAY}
        calendars={CALENDARS}
        events={[ALL_DAY]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const className = slot(container, "calendar-band", "trip")?.className ?? ""
    expect(className).toContain("rounded-l-none")
    expect(className).not.toContain("rounded-l-quebi-sm")
    expect(className).toContain("rounded-r-quebi-sm")
  })

  test("a band cut at the week boundary still loses its trailing radius", () => {
    const { container } = render(
      <WeekView
        date={MONDAY}
        calendars={CALENDARS}
        events={[
          {
            id: "over",
            title: "Offsite",
            start: at(MONDAY.add({ days: 5 }), 0),
            end: at(MONDAY.add({ days: 9 }), 0),
            allDay: true,
            calendarId: "me",
          },
        ]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const className = slot(container, "calendar-band", "over")?.className ?? ""
    // continuesAfter is intact: the two halves must read as one event cut.
    expect(className).toContain("rounded-r-none")
    expect(className).not.toContain("rounded-r-quebi-sm")
    expect(className).toContain("rounded-l-none")
  })

  test("the timed block these two now match still rounds only its trailing corners", () => {
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
    const className = blockFor(container)?.className ?? ""
    expect(className).toContain("rounded-tr-quebi-sm")
    expect(className).toContain("rounded-br-quebi-sm")
    expect(className).not.toContain("rounded-tl-quebi-sm")
    expect(className).not.toContain("rounded-bl-quebi-sm")
  })
})
