/**
 * What the four calendar views draw (task #158).
 *
 * `tests/calendar-packing.test.ts` proves the arithmetic. This file proves the
 * arithmetic reaches the DOM — that a column index becomes a percentage, that
 * the "+N more" says the number the packer computed, and that the three things
 * a read-only calendar still has to get right are got right:
 *
 * 1. **The now-marker is absent until it can be correct.** The site is
 *    prerendered, so a clock read during render puts one time in the HTML and a
 *    different one in the hydrated tree. `now={null}` must therefore draw
 *    nothing, and a pinned `now` must draw it exactly where the minute says.
 * 2. **Colour is never the only channel.** Every block carries its title as
 *    text, and every timeline row carries its calendar's name, so the assertions
 *    are on text rather than on classes.
 * 3. **Selection is reported, not assumed.** Clicking an event fires
 *    `onEventClick` and `onSelectionChange`; clicking the selected one again
 *    clears it.
 *
 * Every view is given an explicit `locale` and `timeZone` and an explicit date,
 * so nothing here depends on the machine running it.
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
import type { CalendarEvent, CalendarSource } from "../../src/components/calendar-shell"
import { CalendarTimeline } from "../../src/components/calendar-timeline"
import { DayView } from "../../src/components/day-view"
import { MonthView } from "../../src/components/month-view"
import { WeekView } from "../../src/components/week-view"
import { calendarShellExamples } from "../../src/registry/calendar-shell.examples"
import { calendarTimelineExamples } from "../../src/registry/calendar-timeline.examples"
import { calendarToolbarExamples } from "../../src/registry/calendar-toolbar.examples"
import { dayViewExamples } from "../../src/registry/day-view.examples"
import { monthViewExamples } from "../../src/registry/month-view.examples"
import type { ComponentExample } from "../../src/registry/types"
import { weekViewExamples } from "../../src/registry/week-view.examples"

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

/** Every rendered event block, keyed by the event id it carries. */
function blocks(container: HTMLElement, slot = "calendar-event") {
  return new Map(
    Array.from(container.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)).map((node) => [
      node.dataset.eventId ?? "",
      node,
    ]),
  )
}

describe("DayView", () => {
  const events: CalendarEvent[] = [
    { id: "long", title: "All morning", start: at(MONDAY, 9), end: at(MONDAY, 11) },
    { id: "short", title: "Standup", start: at(MONDAY, 9, 30), end: at(MONDAY, 10, 30) },
    { id: "after", title: "Retro", start: at(MONDAY, 14), end: at(MONDAY, 15) },
  ]

  const view = (extra: Partial<React.ComponentProps<typeof DayView>> = {}) =>
    render(
      <DayView
        date={MONDAY}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        startHour={8}
        endHour={18}
        hourHeight={48}
        now={null}
        {...extra}
      />,
    )

  test("a minute becomes a pixel offset on the axis", () => {
    // 8:00–18:00 at 48px/hour is a 480px grid, so 09:00 is 48px down and an
    // hour is 48px tall.
    const { container } = view()
    const block = blocks(container).get("long")
    expect(block?.style.top).toBe("48px")
    expect(block?.style.height).toBe("96px")
  })

  test("overlapping events split the width and a free one keeps all of it", () => {
    const { container } = view()
    const found = blocks(container)
    expect(found.get("long")?.style.left).toBe("0%")
    expect(found.get("long")?.style.width).toBe("calc(50% - 2px)")
    expect(found.get("short")?.style.left).toBe("50%")
    // 14:00 overlaps nothing, so its cluster is one column wide.
    expect(found.get("after")?.style.width).toBe("calc(100% - 2px)")
  })

  test("every block carries its title as text, not only as colour", () => {
    view()
    expect(screen.getByText("All morning")).toBeInTheDocument()
    expect(screen.getByText("Standup")).toBeInTheDocument()
  })

  test("no now-marker when there is no now to draw", () => {
    // What a prerender must produce: the clock is not read during render.
    const { container } = view()
    expect(container.querySelector('[data-slot="calendar-now-marker"]')).toBeNull()
  })

  test("a pinned now lands on the minute it names", () => {
    const { container } = view({ now: at(MONDAY, 12, 30) })
    const marker = container.querySelector<HTMLElement>('[data-slot="calendar-now-marker"]')
    // (12:30 − 08:00) = 270 minutes of a 600-minute axis, over 480px.
    expect(marker?.style.top).toBe("216px")
  })

  test("a now on another day draws no marker", () => {
    const { container } = view({ now: at(MONDAY.add({ days: 3 }), 12) })
    expect(container.querySelector('[data-slot="calendar-now-marker"]')).toBeNull()
  })

  test("clicking an event reports it and selects it; clicking again clears it", async () => {
    const clicked: string[] = []
    const selected: (string | null)[] = []
    const { container } = view({
      onEventClick: (event) => clicked.push(event.id),
      onSelectionChange: (id) => selected.push(id),
    })

    const user = userEvent.setup()
    const block = blocks(container).get("long")
    if (!block) throw new Error("no block for 'long'")

    await user.click(block)
    await user.click(block)

    expect(clicked).toEqual(["long", "long"])
    expect(selected).toEqual(["long", null])
  })

  test("an all-day event goes to the band, not the grid", () => {
    const { container } = view({
      events: [
        ...events,
        {
          id: "holiday",
          title: "Public holiday",
          start: at(MONDAY, 0),
          end: at(MONDAY.add({ days: 1 }), 0),
          allDay: true,
        },
      ],
    })
    expect(blocks(container).has("holiday")).toBe(false)
    expect(blocks(container, "calendar-band").has("holiday")).toBe(true)
  })

  test("an overnight event is two blocks over two days, flagged at the seam", () => {
    // Rendered as a week so both halves are on screen at once.
    const { container } = render(
      <WeekView
        date={MONDAY}
        events={[
          { id: "night", title: "On call", start: at(MONDAY, 22), end: at(MONDAY.add({ days: 1 }), 2) },
        ]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        hourHeight={24}
      />,
    )
    const halves = container.querySelectorAll('[data-slot="calendar-event"][data-event-id="night"]')
    expect(halves).toHaveLength(2)
  })
})

describe("WeekView", () => {
  test("seven columns by default, five for a work week", () => {
    const { container, rerender } = render(
      <WeekView date={MONDAY} events={[]} locale={LOCALE} timeZone={ZONE} now={null} />,
    )
    const headers = () => container.querySelectorAll('[data-slot="calendar-day-header"]')
    expect(headers()).toHaveLength(7)

    rerender(
      <WeekView
        date={MONDAY}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        visibleDays={5}
      />,
    )
    expect(headers()).toHaveLength(5)
    // The Saturday of the fixture week is the 26th; a work week stops at the 25th.
    expect(screen.queryByText("26")).toBeNull()
    expect(screen.getByText("25")).toBeInTheDocument()
  })

  test("the locale decides where the week starts", () => {
    // de-DE starts on Monday, so the fixture week is 21–27. en-US starts on
    // Sunday, so the same anchor shows 20–26.
    const { container, rerender } = render(
      <WeekView date={MONDAY} events={[]} locale={LOCALE} timeZone={ZONE} now={null} />,
    )
    expect(container.textContent).toContain("27")
    rerender(<WeekView date={MONDAY} events={[]} locale="en-US" timeZone={ZONE} now={null} />)
    expect(container.textContent).toContain("20")
  })
})

describe("MonthView", () => {
  const crowd: CalendarEvent[] = Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index}`,
    title: `Interview ${index + 1}`,
    start: at(MONDAY, 9 + index),
    end: at(MONDAY, 10 + index),
    calendarId: "team",
  }))

  test("a full day folds into a '+N more' carrying the hidden count", async () => {
    // 116px rows hold four lanes; six events on one day means the last lane is
    // the link, three are drawn and three are hidden.
    const opened: number[] = []
    const { container } = render(
      <MonthView
        date={MONDAY}
        events={crowd}
        calendars={CALENDARS}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        onMoreClick={(_day, events) => opened.push(events.length)}
      />,
    )

    const more = container.querySelector<HTMLElement>('[data-slot="calendar-more"]')
    expect(more?.dataset.moreCount).toBe("3")
    expect(more?.textContent).toBe("+3 more")

    await userEvent.setup().click(more as HTMLElement)
    // The link opens onto everything on the day, not only what it hid.
    expect(opened).toEqual([6])
  })

  test("a multi-day event is one chip spanning the days it covers", () => {
    const { container } = render(
      <MonthView
        date={MONDAY}
        events={[
          {
            id: "trip",
            title: "Offsite",
            start: at(MONDAY, 0),
            end: at(MONDAY.add({ days: 3 }), 0),
            allDay: true,
          },
        ]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    const chip = container.querySelector<HTMLElement>('[data-event-id="trip"]')
    // Three of seven columns — one chip, not three.
    expect(container.querySelectorAll('[data-event-id="trip"]')).toHaveLength(1)
    expect(chip?.style.width).toContain("42.857")
  })

  test("a day number reports itself, which is how a month drills into a day", async () => {
    const pressed: string[] = []
    render(
      <MonthView
        date={MONDAY}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        onDayClick={(day) => pressed.push(day.toString())}
      />,
    )
    await userEvent.setup().click(screen.getByText("21"))
    expect(pressed).toEqual(["2026-09-21"])
  })
})

describe("CalendarTimeline", () => {
  const events: CalendarEvent[] = [
    { id: "a1", title: "Planning", start: at(MONDAY, 9), end: at(MONDAY, 11), calendarId: "me" },
    { id: "a2", title: "Board call", start: at(MONDAY, 10), end: at(MONDAY, 12), calendarId: "me" },
    { id: "b1", title: "Interview", start: at(MONDAY, 13), end: at(MONDAY, 14), calendarId: "team" },
  ]

  test("one row per calendar, each named in text", () => {
    render(
      <CalendarTimeline
        date={MONDAY}
        calendars={CALENDARS}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )
    expect(screen.getByText("My calendar")).toBeInTheDocument()
    expect(screen.getByText("Team")).toBeInTheDocument()
  })

  test("a double booking stacks into a second lane instead of hiding", () => {
    const { container } = render(
      <CalendarTimeline
        date={MONDAY}
        calendars={CALENDARS}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        startHour={8}
        endHour={18}
        hourWidth={60}
        laneHeight={30}
      />,
    )
    const bars = blocks(container, "calendar-bar")
    expect(bars.get("a1")?.style.top).toBe("4px")
    expect(bars.get("a2")?.style.top).toBe("34px")
    // 09:00 is one hour into a ten-hour window drawn 600px wide.
    expect(bars.get("a1")?.style.left).toBe("60px")
    expect(bars.get("a1")?.style.width).toBe("118px")
  })

  test("a row with nothing on it says so", () => {
    render(
      <CalendarTimeline
        date={MONDAY.add({ days: 1 })}
        calendars={CALENDARS}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        emptyRowLabel="Free all day"
      />,
    )
    expect(screen.getAllByText("Free all day")).toHaveLength(2)
  })

  test("the now-marker is pinned to the day on show", () => {
    const { container, rerender } = render(
      <CalendarTimeline
        date={MONDAY}
        calendars={CALENDARS}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={at(MONDAY, 12)}
      />,
    )
    expect(container.querySelectorAll('[data-slot="calendar-now-marker"]').length).toBe(
      CALENDARS.length,
    )

    rerender(
      <CalendarTimeline
        date={MONDAY}
        calendars={CALENDARS}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={at(MONDAY.add({ days: 1 }), 12)}
      />,
    )
    expect(container.querySelector('[data-slot="calendar-now-marker"]')).toBeNull()
  })
})

/**
 * The gallery examples are copied verbatim by agents through
 * `/api/components/<slug>.json`, so a shortcut in one propagates into other
 * people's code. Rendering every one of them here is the cheapest guard against
 * the shortcut that does not even run: they build their fixtures from `today()`,
 * so the day they are rendered on is different every time and the awkward ones
 * (a month that needs six rows, a week that straddles two months) arrive on
 * their own.
 */
/**
 * The axis is the grid's extent (task #161).
 *
 * `toTop` and `toLeft` are unclamped linear maps, and every ancestor between an
 * event block and the scroll box is `overflow: visible` — so anything handed a
 * minute the axis does not cover is not invisible, it is *drawn outside*, where
 * it extends the scrollable area and the reader can scroll through empty space
 * to reach it. That was reported as "the time grid is cut off at 13 o'clock but
 * I can scroll much further to the red line".
 *
 * The fix is geometric rather than a clip: what the axis cannot hold is not
 * given a position at all. These assertions are on `top`/`left` in pixels
 * because that is the thing that was wrong.
 */
describe("nothing is drawn outside the axis", () => {
  /** The reported case: 09:00–13:00 at 64px/hour, so the grid is 256px tall. */
  const bare = (extra: Partial<React.ComponentProps<typeof DayView>> = {}) =>
    render(
      <DayView
        date={MONDAY}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        startHour={9}
        endHour={13}
        hourHeight={64}
        now={null}
        {...extra}
      />,
    )

  test("a now outside the axis draws no marker", () => {
    const { container } = bare({ now: at(MONDAY, 19, 4) })
    expect(container.querySelector('[data-slot="calendar-now-marker"]')).toBeNull()
  })

  test("a now before the axis draws no marker either", () => {
    const { container } = bare({ now: at(MONDAY, 6, 30) })
    expect(container.querySelector('[data-slot="calendar-now-marker"]')).toBeNull()
  })

  test("a now inside the axis still lands on its minute", () => {
    const { container } = bare({ now: at(MONDAY, 10, 30) })
    const marker = container.querySelector<HTMLElement>('[data-slot="calendar-now-marker"]')
    // 90 minutes into a 240-minute axis drawn 256px tall.
    expect(marker?.style.top).toBe("96px")
  })

  test("the closing hour is on the axis, where it is the last gridline", () => {
    const { container } = bare({ now: at(MONDAY, 13) })
    const marker = container.querySelector<HTMLElement>('[data-slot="calendar-now-marker"]')
    expect(marker?.style.top).toBe("256px")
  })

  test("an event outside the axis is not drawn", () => {
    const { container } = bare({
      events: [{ id: "evening", title: "Dinner", start: at(MONDAY, 21), end: at(MONDAY, 22) }],
    })
    expect(blocks(container).size).toBe(0)
  })

  test("an event crossing the axis is cut at it, not drawn past it", () => {
    const { container } = bare({
      events: [{ id: "long", title: "Offsite", start: at(MONDAY, 8), end: at(MONDAY, 20) }],
    })
    const block = blocks(container).get("long")
    expect(block?.style.top).toBe("0px")
    expect(block?.style.height).toBe("256px")
  })

  test("a block too short to draw is pushed onto the axis, not past its foot", () => {
    // 12:55–13:00 computes to 5.33px and is drawn at the 18px minimum, which
    // grows downwards — off the end of a 256px grid unless it is pushed back.
    const { container } = bare({
      events: [{ id: "tiny", title: "Ping", start: at(MONDAY, 12, 55), end: at(MONDAY, 13) }],
    })
    const block = blocks(container).get("tiny")
    expect(block?.style.height).toBe("18px")
    expect(block?.style.top).toBe("238px")
  })

  test("the timeline draws no bar for an event off its axis either", () => {
    const { container } = render(
      <CalendarTimeline
        date={MONDAY}
        calendars={CALENDARS}
        events={[
          { id: "night", title: "On call", start: at(MONDAY, 21), end: at(MONDAY, 22), calendarId: "me" },
          { id: "day", title: "Planning", start: at(MONDAY, 9), end: at(MONDAY, 10), calendarId: "me" },
        ]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        startHour={8}
        endHour={18}
        hourWidth={60}
      />,
    )
    const bars = blocks(container, "calendar-bar")
    expect(bars.has("night")).toBe(false)
    expect(bars.get("day")?.style.left).toBe("60px")
  })
})

describe("the published examples", () => {
  const sets: [string, ComponentExample[]][] = [
    ["calendar-shell", calendarShellExamples],
    ["calendar-toolbar", calendarToolbarExamples],
    ["day-view", dayViewExamples],
    ["week-view", weekViewExamples],
    ["month-view", monthViewExamples],
    ["calendar-timeline", calendarTimelineExamples],
  ]

  for (const [slug, examples] of sets) {
    test(`${slug} renders every example`, () => {
      expect(examples.length).toBeGreaterThan(0)
      for (const example of examples) {
        const { container, unmount } = render(example.render())
        expect(container.textContent?.length ?? 0).toBeGreaterThan(0)
        unmount()
      }
    })
  }
})
