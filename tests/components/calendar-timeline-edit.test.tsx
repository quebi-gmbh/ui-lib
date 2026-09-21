/**
 * Moving and resizing a CalendarTimeline bar (task #183).
 *
 * The three traps this covers are all about the difference between the bar and
 * the event. A bar is a *segment* — clipped to one day and to the window — so a
 * drag has to reach the underlying `ZonedDateTime`s; its drawn box is floored at
 * `MIN_BAR_WIDTH` and pushed back onto the grid, so a resize measured from the
 * rectangle would resize to whatever the floor invented; and the snap step is
 * derived from `pixelsPerHour`, so the same keypress is a quarter of an hour on
 * a one-day axis and an hour on a thirty-day one. Every assertion below is an
 * exact instant for that reason.
 *
 * The keyboard is the whole interaction here rather than a fallback for it:
 * `useMove` reports a pointer drag and an arrow key through the same three
 * callbacks, so driving it with keys exercises the same arithmetic a pointer
 * does — and it is the half a DOM with no layout can run at all.
 *
 * Every render is given an explicit `locale`, `timeZone`, date and `now`, so
 * nothing here depends on the machine running it.
 */
import { afterEach, describe, expect, test } from "bun:test"
import {
  type CalendarDate,
  parseZonedDateTime,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date"
import { cleanup, render } from "@testing-library/react"
import * as React from "react"
import userEvent from "@testing-library/user-event"
import type { CalendarEvent, CalendarSource } from "../../src/components/calendar-shell"
import { CalendarTimeline } from "../../src/components/calendar-timeline"

afterEach(cleanup)

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture day the rest of the suite uses. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), ZONE)

const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue" },
  { id: "borealis", name: "Borealis", color: "orange" },
]

const PLANNING: CalendarEvent = {
  id: "planning",
  title: "Planning",
  start: at(MONDAY, 9),
  end: at(MONDAY, 11),
  calendarId: "aurora",
}

interface Change {
  id: string
  start: string
  end: string
  calendarId?: string
}

/** A timeline whose changes are collected rather than applied. */
function setup(
  overrides: Partial<React.ComponentProps<typeof CalendarTimeline>> = {},
  events: CalendarEvent[] = [PLANNING],
) {
  const changes: Change[] = []
  const selected: (string | null)[] = []
  const { container } = render(
    <CalendarTimeline
      calendars={ROOMS}
      events={events}
      defaultDate={MONDAY}
      timeZone={ZONE}
      locale={LOCALE}
      now={null}
      isEventEditable
      onSelectionChange={(id) => selected.push(id)}
      onEventChange={(event, next) =>
        changes.push({
          id: event.id,
          start: next.start.toString(),
          end: next.end.toString(),
          calendarId: next.calendarId,
        })
      }
      {...overrides}
    />,
  )
  return { container, changes, selected }
}

const part = (container: HTMLElement, name: "body" | "start" | "end", id = "planning") =>
  container.querySelector<HTMLElement>(
    `[data-event-id="${id}"] [data-drag-part="${name}"]`,
  )

/** Press a key with the given part focused, the way a keyboard user reaches it. */
async function press(element: HTMLElement | null, keys: string) {
  if (!element) throw new Error("no such part of the bar")
  const user = userEvent.setup()
  element.focus()
  await user.keyboard(keys)
}

describe("what an editable bar is made of", () => {
  test("it is a slider with a handle at each end; a read-only bar is still a Button", () => {
    const editable = setup()
    expect(
      editable.container.querySelector<HTMLElement>('[data-event-id="planning"]')?.dataset
        .editable,
    ).toBe("true")
    expect(part(editable.container, "body")?.getAttribute("role")).toBe("slider")
    expect(part(editable.container, "start")).not.toBeNull()
    expect(part(editable.container, "end")).not.toBeNull()

    cleanup()
    const readOnly = setup({ isEventEditable: false })
    expect(readOnly.container.querySelector("[data-editable]")).toBeNull()
    expect(
      readOnly.container.querySelector('[data-slot="calendar-bar-button"]')?.tagName,
    ).toBe("BUTTON")
  })

  test("an omitted onEventChange leaves the bar read-only, whatever the predicate says", () => {
    const { container } = setup({ onEventChange: undefined })
    expect(container.querySelector("[data-editable]")).toBeNull()
  })

  test("an all-day band is never editable: it fills the window rather than occupying a time", () => {
    const { container } = setup({}, [
      {
        id: "leave",
        title: "Annual leave",
        start: at(MONDAY, 0),
        end: at(MONDAY.add({ days: 1 }), 0),
        allDay: true,
        calendarId: "aurora",
      },
    ])
    expect(container.querySelector('[data-event-id="leave"]')).not.toBeNull()
    expect(container.querySelector("[data-editable]")).toBeNull()
  })

  test("a bar too narrow for two handles and a body is move-only", () => {
    // Thirty days is 8px an hour, so a two-hour booking is a 24px sliver — the
    // MIN_BAR_WIDTH floor — and 44px is the floor for carrying handles.
    const { container } = setup({ days: 30 })
    expect(part(container, "body")).not.toBeNull()
    expect(part(container, "start")).toBeNull()
    expect(part(container, "end")).toBeNull()
  })

  test("a segment the axis cut is not editable at all — not even movable", () => {
    // The drawn start is 10:00 because the window begins there, not because the
    // event does, so every delta measured from this bar is a delta from the edge
    // of the grid. The week view refuses the same gesture (task #182).
    const { container } = setup({ startHour: 10 }, [
      { ...PLANNING, start: at(MONDAY, 9), end: at(MONDAY, 14) },
    ])
    expect(container.querySelector('[data-slot="calendar-bar"]')).not.toBeNull()
    expect(container.querySelector("[data-editable]")).toBeNull()
  })
})

describe("moving along the axis", () => {
  test("one arrow press is one snap step, applied to the event and not to the segment", async () => {
    const { container, changes } = setup()
    await press(part(container, "body"), "{ArrowRight}")

    expect(changes).toHaveLength(1)
    expect(changes[0]?.start).toBe(at(MONDAY, 9, 15).toString())
    expect(changes[0]?.end).toBe(at(MONDAY, 11, 15).toString())
    // The row is reported on every change, so one handler can apply all three.
    expect(changes[0]?.calendarId).toBe("aurora")
  })

  test("the step comes from the scale: 15 minutes a day, half an hour a week, an hour a month", async () => {
    const day = setup()
    await press(part(day.container, "body"), "{ArrowRight}")
    expect(day.changes[0]?.start).toBe(at(MONDAY, 9, 15).toString())

    cleanup()
    const week = setup({ days: 7 })
    await press(part(week.container, "body"), "{ArrowRight}")
    expect(week.changes[0]?.start).toBe(at(MONDAY, 9, 30).toString())

    cleanup()
    const month = setup({ days: 30 })
    await press(part(month.container, "body"), "{ArrowRight}")
    expect(month.changes[0]?.start).toBe(at(MONDAY, 10).toString())
  })

  test("a bar off the grid is snapped onto it rather than moved by a step from where it was", async () => {
    const { container, changes } = setup({}, [
      { ...PLANNING, start: at(MONDAY, 9, 7), end: at(MONDAY, 10, 7) },
    ])
    await press(part(container, "body"), "{ArrowRight}")
    // 9:07 + 15 is 9:22, snapped to the 15-minute grid: 9:15. The length is kept.
    expect(changes[0]?.start).toBe(at(MONDAY, 9, 15).toString())
    expect(changes[0]?.end).toBe(at(MONDAY, 10, 15).toString())
  })

  test("the window is the limit: a bar at the end of the axis does not leave it", async () => {
    const { container, changes } = setup({ startHour: 9, endHour: 11 }, [PLANNING])
    await press(part(container, "body"), "{ArrowRight}")
    expect(changes).toHaveLength(0)
  })

  test("a step off the end of one day arrives at the start of the next", async () => {
    const { container, changes } = setup({ days: 3, startHour: 9, endHour: 11 }, [PLANNING])
    await press(part(container, "body"), "{ArrowRight}")
    expect(changes[0]?.start).toBe(at(MONDAY.add({ days: 1 }), 9).toString())
    expect(changes[0]?.end).toBe(at(MONDAY.add({ days: 1 }), 11).toString())
  })
})

describe("moving between rows", () => {
  test("down a row is another calendar, and the time is untouched", async () => {
    const { container, changes } = setup()
    await press(part(container, "body"), "{ArrowDown}")

    expect(changes).toHaveLength(1)
    expect(changes[0]?.calendarId).toBe("borealis")
    expect(changes[0]?.start).toBe(PLANNING.start.toString())
    expect(changes[0]?.end).toBe(PLANNING.end.toString())
  })

  test("the last row is the last row", async () => {
    const { container, changes } = setup({}, [{ ...PLANNING, calendarId: "borealis" }])
    await press(part(container, "body"), "{ArrowDown}")
    expect(changes).toHaveLength(0)
  })
})

describe("resizing", () => {
  test("the start handle moves the start and leaves the end where it was", async () => {
    const { container, changes } = setup()
    await press(part(container, "start"), "{ArrowLeft}")

    expect(changes[0]?.start).toBe(at(MONDAY, 8, 45).toString())
    expect(changes[0]?.end).toBe(PLANNING.end.toString())
  })

  test("the end handle moves the end and leaves the start where it was", async () => {
    const { container, changes } = setup()
    await press(part(container, "end"), "{ArrowRight}")

    expect(changes[0]?.start).toBe(PLANNING.start.toString())
    expect(changes[0]?.end).toBe(at(MONDAY, 11, 15).toString())
  })

  test("Shift and an arrow resizes from the bar itself, which is all a sliver has", async () => {
    // Thirty days: the bar carries no handles at all, so this is the only
    // resize it has — and one step there is an hour.
    const { container, changes } = setup({ days: 30 })
    await press(part(container, "body"), "{Shift>}{ArrowRight}{/Shift}")

    expect(changes[0]?.start).toBe(PLANNING.start.toString())
    expect(changes[0]?.end).toBe(at(MONDAY, 12).toString())
  })

  test("an event is never shortened below one step", async () => {
    const { container, changes } = setup({}, [
      { ...PLANNING, start: at(MONDAY, 9), end: at(MONDAY, 9, 15) },
    ])
    // A quarter-hour bar at 72px an hour is 18px of event drawn as a 24px box,
    // which is the case the model has to be read for: Shift is the only resize
    // a bar with no room for handles has, and one step shorter than a quarter
    // hour is nothing at all.
    await press(part(container, "body"), "{Shift>}{ArrowLeft}{/Shift}")
    expect(changes).toHaveLength(0)
  })

  test("the minimum holds on a handle too, at a scale where a short bar has one", async () => {
    const { container, changes } = setup({ hourWidth: 200 }, [
      { ...PLANNING, start: at(MONDAY, 9), end: at(MONDAY, 9, 15) },
    ])
    expect(part(container, "end")).not.toBeNull()
    await press(part(container, "end"), "{ArrowLeft}")
    expect(changes).toHaveLength(0)
  })

  test("a resize does not reach through a day boundary the way a move does", async () => {
    const { container, changes } = setup({ days: 3, startHour: 9, endHour: 11 }, [PLANNING])
    await press(part(container, "end"), "{ArrowRight}")
    expect(changes).toHaveLength(0)
  })
})

describe("what editing does not take away", () => {
  test("a plain click still selects", async () => {
    const { container, selected, changes } = setup()
    const user = userEvent.setup()
    const body = part(container, "body")
    if (!body) throw new Error("no bar")
    await user.click(body)

    expect(selected).toEqual(["planning"])
    expect(changes).toHaveLength(0)
  })

  test("Enter selects too, so the keyboard reaches both things the bar does", async () => {
    const { container, selected } = setup()
    await press(part(container, "body"), "{Enter}")
    expect(selected).toEqual(["planning"])
  })

  test("the bar still carries its full name for a screen reader and a hover", () => {
    const { container } = setup()
    const name = "Planning, 9:00 – 11:00"
    expect(container.querySelector('[data-event-id="planning"]')?.getAttribute("title")).toBe(name)
    expect(part(container, "body")?.getAttribute("aria-label")).toBe(name)
  })

  test("each handle says which edge it is and what time that edge is at", () => {
    const { container } = setup()
    expect(part(container, "start")?.getAttribute("aria-label")).toBe("Planning, start time")
    expect(part(container, "start")?.getAttribute("aria-valuetext")).toBe("9:00")
    expect(part(container, "end")?.getAttribute("aria-label")).toBe("Planning, end time")
    expect(part(container, "end")?.getAttribute("aria-valuetext")).toBe("11:00")
  })
})

describe("the events stay the caller's", () => {
  test("a reported change is not applied: the bar is where it was until events change", async () => {
    const { container, changes } = setup()
    await press(part(container, "body"), "{ArrowRight}")

    expect(changes).toHaveLength(1)
    expect(part(container, "body")?.getAttribute("aria-label")).toBe("Planning, 9:00 – 11:00")
  })

  test("an applied change moves the bar and keeps the focus on it", async () => {
    function Controlled() {
      const [events, setEvents] = React.useState<CalendarEvent[]>([PLANNING])
      return (
        <CalendarTimeline
          calendars={ROOMS}
          events={events}
          defaultDate={MONDAY}
          timeZone={ZONE}
          locale={LOCALE}
          now={null}
          isEventEditable
          onEventChange={(event, next) =>
            setEvents((current) =>
              current.map((entry) =>
                entry.id === event.id
                  ? { ...entry, start: next.start, end: next.end, calendarId: next.calendarId }
                  : entry,
              ),
            )
          }
        />
      )
    }

    const { container } = render(<Controlled />)
    await press(part(container, "body"), "{ArrowRight}")

    const body = part(container, "body")
    expect(body?.getAttribute("aria-label")).toBe("Planning, 9:15 – 11:15")
    // The keypress is the gesture, so the next one has to land on the same bar.
    expect(document.activeElement).toBe(body)
  })
})
