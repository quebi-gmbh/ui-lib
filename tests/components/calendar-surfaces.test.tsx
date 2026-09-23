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
  CalendarLegend,
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
 * A selected block paints above the blocks it touches.
 *
 * Selection is an outline, and an outline sits *outside* the border box. The
 * 2px that separates two blocks is horizontal only — an event ending at noon
 * and the one starting there share their edge exactly — so a selected block's
 * outline lands inside its neighbour's rectangle, and every block is
 * `position: absolute` at `z-index: auto`. Paint order was therefore DOM
 * order, and the packing emits blocks in start order: selecting the earlier of
 * two back-to-back events had the later one draw its own fill over the bottom
 * of the selection outline. Reported against `/components/day-view` — "the
 * selection border is partially covered by the following date".
 *
 * What is pinned is the shape of the fix: the element that carries the
 * geometry is raised while selected, by one step rather than ten, so the
 * now-marker and the drag ghost still pass over the top of it.
 */
describe("a selected block outranks the blocks it touches", () => {
  /** 09:30–12:00 and the lunch that starts the minute it ends. */
  const FOCUS: CalendarEvent = {
    id: "focus",
    title: "Focus block",
    start: at(MONDAY, 9, 30),
    end: at(MONDAY, 12),
    calendarId: "me",
  }
  const LUNCH: CalendarEvent = {
    id: "lunch",
    title: "Lunch",
    start: at(MONDAY, 12),
    end: at(MONDAY, 13),
    calendarId: "me",
  }

  const day = (selectedEventId: string | null) =>
    render(
      <DayView
        date={MONDAY}
        calendars={CALENDARS}
        events={[FOCUS, LUNCH]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        selectedEventId={selectedEventId}
      />,
    )

  /** The `z-[n]` on an element, or 0 for `z-index: auto`. */
  const layer = (element: Element | null | undefined) =>
    Number(element?.className.match(/(?:^|\s)z-\[(\d+)]/)?.[1] ?? 0)

  test("the selected block is raised and the one below it is not", () => {
    const { container } = day("focus")
    expect(layer(blockFor(container, "focus"))).toBeGreaterThan(0)
    expect(layer(blockFor(container, "lunch"))).toBe(0)
  })

  test("selecting the later block raises that one instead", () => {
    const { container } = day("lunch")
    expect(layer(blockFor(container, "lunch"))).toBeGreaterThan(0)
    expect(layer(blockFor(container, "focus"))).toBe(0)
  })

  test("nothing is raised while nothing is selected", () => {
    const { container } = day(null)
    for (const id of ["focus", "lunch"]) {
      expect([id, layer(blockFor(container, id))]).toEqual([id, 0])
    }
  })

  test("the raise stays under the now-marker and the drag ghost, which are z-10", () => {
    const { container } = day("focus")
    expect(layer(blockFor(container, "focus"))).toBeLessThan(10)
  })

  test("a movable block is raised on the wrapper, which is the positioned element", () => {
    const { container } = render(
      <DayView
        date={MONDAY}
        calendars={CALENDARS}
        events={[FOCUS, LUNCH]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        selectedEventId="focus"
        isEventEditable
        onEventChange={() => {}}
      />,
    )
    const block = blockFor(container, "focus")
    const wrapper = block?.closest('[data-slot="calendar-event-move"]')
    expect(wrapper).not.toBeNull()
    // The button inside the wrapper is `h-full w-full` and statically
    // positioned, so a z-index on it would do nothing at all.
    expect(layer(wrapper)).toBeGreaterThan(0)
    expect(layer(block)).toBe(0)
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

  // The radius is the row's own shorthand now, and a caller squares a corner
  // over the top of it — so what a corner ends up as is the shorthand unless a
  // `rounded-<side>-none` from the call site has displaced it.
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
    // The trailing edge keeps the radius: only the accent is straightened.
    expect(className).toContain("rounded-quebi-sm")
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
    expect(className).toContain("rounded-quebi-sm")
    expect(className).not.toContain("rounded-l-none")
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

/**
 * The scrolling grid draws the library's scrollbar, not the platform's.
 *
 * The shell's time grid was the one scroll surface in the library that never
 * took `quebi-scrollbar`, so a week view painted whatever the OS paints —
 * stepper arrows at each end under Linux Chromium, a grey slab elsewhere —
 * inside a card whose every other scroller shows the 6px quebi pill.
 *
 * Two halves are pinned, because the bar only lands right when both hold: the
 * viewport asks for the pill, and the shell above it keeps the
 * `overflow-hidden` + radius that clips the pill's ends to the card's corner.
 * That clip is why the viewport itself needs no `quebi-scrollbar-corners` —
 * drop it from the shell and the bar squares off against the bottom edge again.
 */
describe("the calendar grid scrolls behind the quebi bar", () => {
  const viewport = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[data-slot="calendar-viewport"]')

  test("the week view's scrolling grid carries the utility", () => {
    const { container } = render(
      <WeekView
        date={MONDAY}
        calendars={CALENDARS}
        events={[EVENT]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const className = viewport(container)?.className ?? ""
    expect(className).toContain("quebi-scrollbar")
    expect(className).toContain("overflow-y-auto")
    // The bar is the flush default: neither variant belongs on a grid whose
    // content must not scroll under it.
    expect(className).not.toContain("quebi-scrollbar-floating")
    expect(className).not.toContain("quebi-scrollbar-none")
  })

  test("the day view is the same shell, so it gets it too", () => {
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
    expect(viewport(container)?.className ?? "").toContain("quebi-scrollbar")
  })

  test("the shell above it still clips the bar to its own corner", () => {
    const { container } = render(
      <WeekView
        date={MONDAY}
        calendars={CALENDARS}
        events={[EVENT]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const shell = container.querySelector<HTMLElement>('[data-slot="calendar-shell"]')
    expect(shell).not.toBeNull()
    expect(shell?.className).toContain("overflow-hidden")
    expect(shell?.className).toContain("rounded-quebi-md")
    // The clip has to be an ancestor of the bar for it to reach it at all.
    expect(shell?.contains(viewport(container))).toBe(true)
  })
})

/**
 * The legend has one variant, and it exists for one situation.
 *
 * Where a legend sits is layout — above the view, below it, in a column beside
 * it — and the library owns none of that: it is a child and a className. What
 * it cannot own is what happens when the legend is laid *over* the grid, where
 * a row of `text-xs text-quebi-fg-muted` has events, hour rules and column
 * seams behind it. That is `variant="overlay"`, and pinning it here keeps the
 * plain row plain: a legend on its own line must not arrive carrying a border
 * and a shadow.
 */
describe("the legend's overlay variant", () => {
  const legend = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[data-slot="calendar-legend"]')

  test("the default is a bare row — no surface, no edge, no lift", () => {
    const { container } = render(<CalendarLegend calendars={CALENDARS} />)
    const className = legend(container)?.className ?? ""
    expect(className).not.toContain("bg-quebi-elevated")
    expect(className).not.toContain("border")
    expect(className).not.toContain("shadow")
  })

  test("the overlay is an elevated surface, so the grid cannot swallow it", () => {
    const { container } = render(<CalendarLegend calendars={CALENDARS} variant="overlay" />)
    const className = legend(container)?.className ?? ""
    expect(className).toContain("bg-quebi-elevated")
    // A hairline is the token at an alpha, never a raw palette scale.
    expect(className).toMatch(/border-quebi-line\/\d+/)
    // Neutral occlusion, not the mint glow — the argument is in popover.tsx.
    expect(className).toContain("shadow-lg")
    expect(className).toContain("rounded-quebi-md")
  })

  test("both variants are still the same row of dots", () => {
    for (const variant of ["plain", "overlay"] as const) {
      const { container } = render(<CalendarLegend calendars={CALENDARS} variant={variant} />)
      expect(container.textContent).toContain("My calendar")
      expect(legend(container)?.dataset.variant).toBe(variant)
      expect(legend(container)?.className).toContain("flex-wrap")
    }
  })

  test("a className still lands on it, because placement is the caller's", () => {
    const { container } = render(
      <CalendarLegend calendars={CALENDARS} variant="overlay" className="absolute end-3 bottom-3" />,
    )
    expect(legend(container)?.className).toContain("absolute")
  })
})
