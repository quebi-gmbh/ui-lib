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
import { calendarColorNames } from "../../src/lib/calendar"
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
 * Every ground is opaque, and none of it is a hue.
 *
 * A tint written `bg-blue-500/15` leaves the bar 85% transparent, so the hour
 * lines, the sub-slot lines and the column rules the grid draws *underneath* an
 * event stay legible straight through it. Ink & Paper also drops the hues: each
 * slot is a ground (paper, tint, raised, pressed, hatched) crossed with an edge
 * style. What is pinned is the shape: a token ground or a `color-mix` against
 * `--color-quebi-bg`, never an alpha suffix and never a Tailwind palette scale.
 */
describe("the calendar palette is opaque ink", () => {
  const entries = Object.entries(CALENDAR_COLORS)
  const GROUND = /(?:^|\s)bg-(?:quebi-(?:bg|raised|pressed)|\[color-mix\(in_oklab,[^\s]*var\(--color-quebi-bg\)\)\])(?:\s|$)/

  test("every fill is an opaque ground, not an alpha", () => {
    expect(entries.length).toBeGreaterThan(0)
    for (const [name, palette] of entries) {
      for (const [field, value] of [
        ["block", palette.block],
        ["band", palette.band],
      ] as const) {
        const where = `${name}.${field}: ${value}`
        expect(where).not.toMatch(/bg-[\w-]+\/[\d.]+/)
        expect([where, GROUND.test(value)]).toEqual([where, true])
      }
    }
  })

  test("no slot is drawn in a hue", () => {
    for (const [name, palette] of entries) {
      const all = Object.values(palette).join(" ")
      // `blue-500`, `emerald-500` — a Tailwind palette scale.
      expect([name, /-[a-z]+-\d{2,3}\b/.test(all)]).toEqual([name, false])
    }
  })

  test("every block answers hover", () => {
    for (const [name, palette] of entries) {
      expect([name, palette.block.includes("hover:bg-")]).toEqual([name, true])
    }
  })

  test("adjacent slots never draw alike", () => {
    for (let index = 1; index < calendarColorNames.length; index++) {
      const a = CALENDAR_COLORS[calendarColorNames[index - 1] as keyof typeof CALENDAR_COLORS]
      const b = CALENDAR_COLORS[calendarColorNames[index] as keyof typeof CALENDAR_COLORS]
      expect(`${a.block} ${a.edge}`).not.toBe(`${b.block} ${b.edge}`)
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
 * Selection is a signal outline; focus is an inset ring.
 *
 * Selection was once drawn as the focus treatment byte for byte — an *inset*
 * ring that landed exactly on the 2px `edge` and erased the only mark of which
 * calendar the event belonged to, and a merely focused event was
 * indistinguishable from a selected one. What is pinned: selection and focus
 * never share a treatment, selection comes from the palette, and the accent
 * survives it.
 */
describe("selection is drawn as an outline from the palette", () => {
  const entries = Object.entries(CALENDAR_COLORS)

  test("every palette entry carries an outline selection colour", () => {
    for (const [name, palette] of entries) {
      expect([name, typeof palette.selected]).toEqual([name, "string"])
      expect([name, palette.selected.startsWith("outline-")]).toEqual([name, true])
    }
  })

  test("selection is signal, the same for every slot", () => {
    for (const [name, palette] of entries) {
      expect([name, palette.selected]).toEqual([name, "outline-quebi-signal"])
    }
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

    // Focus is still the inset ring, and still only under focus-visible.
    expect(className).toContain("focus-visible:ring-quebi-focus")
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
 * The accented edge is a straight line, not a crescent.
 *
 * A radius on a 20px chip bends the 2px `edge` round its corners, so the
 * accent reads as a crescent hooked into a pill rather than a straight bar.
 * Ink & Paper is square throughout; pinned here so that no surface carrying an
 * accent picks a radius back up.
 */
describe("the colour accent is a straight line, not a crescent", () => {
  const chipFor = (container: HTMLElement, id: string) => slot(container, "calendar-chip", id)
  const rounded = (className: string) =>
    className.split(/\s+/).filter((name) => name.startsWith("rounded") && !name.endsWith("-none"))

  test("a filled month chip is square and carries the accent", () => {
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
    expect(rounded(className)).toEqual([])
    expect(className).toContain("border-l-2")
    expect(className).toContain(CALENDAR_COLORS.blue.edge)
  })

  test("a timed month chip has no accent and no radius", () => {
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
    expect(rounded(className)).toEqual([])
  })

  test("the week all-day band and the timed block are square too", () => {
    const week = render(
      <WeekView
        date={MONDAY}
        calendars={CALENDARS}
        events={[ALL_DAY]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    expect(rounded(slot(week.container, "calendar-band", "trip")?.className ?? "")).toEqual([])
    week.unmount()

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
    expect(rounded(className)).toEqual([])
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

  test("the shell above it still clips the bar", () => {
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
    expect(className).toContain("border-quebi-hairline")
    // The one shadow, on a floating surface, with the small floating radius.
    expect(className).toContain("shadow-quebi-float")
    expect(className).toContain("rounded-quebi-s")
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
