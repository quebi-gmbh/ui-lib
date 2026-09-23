/**
 * Dragging a month chip onto another day — task #182's gesture, over a grid
 * that has no time axis.
 *
 * `MonthView` answers a different question from the day and week grids, and
 * this file is about that difference. There a drop is an absolute position on a
 * time axis; here a cell has no axis at all, so the only thing a drop can say
 * is *which day* — and the move is therefore a signed number of days with the
 * clock left alone. Four things follow, and they are taken in order:
 *
 * 1. **The row a drag is over.** `weekIndexAtOffset` is `dayIndexAtOffset`'s
 *    other axis: every row is exactly `weekHeight` tall, so the hit test is
 *    arithmetic rather than a measurement per row.
 * 2. **The hand-off.** `onEventChange` fires once, on drop, with the duration
 *    and the time of day preserved — and never as the tail of a plain click,
 *    which still selects. Pointer and keyboard both, because an event that can
 *    only be moved by dragging cannot be moved by everyone.
 * 3. **The distance is measured from the cell the gesture started on**, not
 *    from the event, which is what lets a chip the week boundary cut in two be
 *    picked up by either half. The day grids refuse their cut blocks; this one
 *    does not, and the two rules are the same rule asked of different geometry.
 * 4. **What the ghost is a picture of.** It is packed against the week it is
 *    over, so it sits in the lane the drop would really give it rather than on
 *    top of whatever is already there.
 *
 * Every assertion pins locale, zone and date, so nothing here depends on the
 * machine running it.
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
import { act } from "react"
import { createEvent, fireEvent, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CalendarEvent, CalendarEventChange } from "../../src/components/calendar-shell"
import { MonthView, weekIndexAtOffset } from "../../src/components/month-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/**
 * September 2026. Under `de-DE` the grid runs Monday 31 August to Sunday 4
 * October: five rows of seven, so a cell index is `row * 7 + column` and the
 * 16th is row 2, column 2.
 */
const SEPTEMBER: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-15T00:00[${ZONE}]`))
const day = (date: number) => SEPTEMBER.set({ day: date })

const at = (date: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(date, new Time(hour, minute)), ZONE)

/** Wednesday the 16th, 10:00–11:30 — row 2, column 2 of the grid. */
const KICKOFF: CalendarEvent = {
  id: "kickoff",
  title: "Kickoff",
  start: at(day(16), 10),
  end: at(day(16), 11, 30),
}

/** Friday the 18th to Tuesday the 22nd: one event, two chips, two rows. */
const TRIP: CalendarEvent = {
  id: "trip",
  title: "Trip",
  start: at(day(18), 0),
  end: at(day(22), 0),
  allDay: true,
}

/** The default row height, which is what the row hit test is arithmetic over. */
const WEEK_HEIGHT = 116

/**
 * A pointer event that carries page coordinates.
 *
 * `useMove` measures in `pageX`/`pageY`, and happy-dom derives those from a
 * layout it never performs, so they read 0 whatever the init dict says.
 * Defining them on the event is the only way to hand the hook a distance.
 */
const pointer = (
  kind: "pointerDown" | "pointerMove" | "pointerUp",
  target: HTMLElement | Window,
  x: number,
  y: number,
) => {
  const event = createEvent[kind](target as HTMLElement, { button: 0, pointerId: 1 })
  Object.defineProperty(event, "pageX", { value: x })
  Object.defineProperty(event, "pageY", { value: y })
  fireEvent(target as HTMLElement, event)
}

describe("weekIndexAtOffset", () => {
  test("reads the row the pointer is over", () => {
    expect(weekIndexAtOffset(0, WEEK_HEIGHT, 5)).toBe(0)
    expect(weekIndexAtOffset(250, WEEK_HEIGHT, 5)).toBe(2)
    expect(weekIndexAtOffset(579, WEEK_HEIGHT, 5)).toBe(4)
  })

  test("clamps to the row a drag left by", () => {
    expect(weekIndexAtOffset(-300, WEEK_HEIGHT, 5)).toBe(0)
    expect(weekIndexAtOffset(4000, WEEK_HEIGHT, 5)).toBe(4)
  })

  test("answers zero when there is nothing to hit-test against", () => {
    expect(weekIndexAtOffset(250, 0, 5)).toBe(0)
    expect(weekIndexAtOffset(250, WEEK_HEIGHT, 1)).toBe(0)
  })
})

describe("MonthView move", () => {
  const view = (
    extra: Partial<React.ComponentProps<typeof MonthView>> = {},
    events: CalendarEvent[] = [KICKOFF],
  ) =>
    render(
      <MonthView
        date={SEPTEMBER}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        showToolbar={false}
        isEventEditable
        {...extra}
      />,
    )

  /** Every chip drawn for one event — two, for an event crossing a week. */
  const chipsOf = (container: HTMLElement, id: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        `[data-slot="calendar-chip"][data-event-id="${id}"]`,
      ),
    )

  const chipOf = (container: HTMLElement, id: string) => chipsOf(container, id)[0]

  /** The changes one render reported, newest last. */
  const recorder = () => {
    const calls: Array<[CalendarEvent, CalendarEventChange]> = []
    return {
      calls,
      onEventChange: (event: CalendarEvent, next: CalendarEventChange) => {
        calls.push([event, next])
      },
    }
  }

  /** Minutes between two instants, which is the thing a move must not change. */
  const minutes = (next: CalendarEventChange) =>
    (next.end.toDate().getTime() - next.start.toDate().getTime()) / 60_000

  /** The one box the hit test needs: seven columns of a hundred pixels. */
  const stubGrid = (container: HTMLElement) => {
    const grid = container.querySelector<HTMLElement>('[data-slot="month-grid"]')
    expect(grid).not.toBeNull()
    if (grid) {
      grid.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: 700,
          height: 5 * WEEK_HEIGHT,
          right: 700,
          bottom: 5 * WEEK_HEIGHT,
          x: 0,
          y: 0,
        }) as DOMRect
    }
  }

  test("left and right move the focused event one day, at the same time", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    const chip = chipOf(container, "kickoff")
    expect(chip).toBeDefined()

    // Focus is a state update in react-aria's focus ring, so it is the test's
    // to wrap; `fireEvent` wraps its own.
    act(() => chip?.focus())
    fireEvent.keyDown(chip as HTMLElement, { key: "ArrowRight" })

    expect(changes.calls).toHaveLength(1)
    const [event, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(event.id).toBe("kickoff")
    expect(next.start.day).toBe(17)
    expect(next.start.hour).toBe(10)
    expect(minutes(next)).toBe(90)
    // Month columns are days, so there is no calendar to report landing on.
    expect(next.calendarId).toBeUndefined()
  })

  test("up and down move it a whole week", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    const chip = chipOf(container, "kickoff")

    act(() => chip?.focus())
    fireEvent.keyDown(chip as HTMLElement, { key: "ArrowDown" })

    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(next.start.day).toBe(23)
    expect(next.start.hour).toBe(10)
    expect(minutes(next)).toBe(90)
  })

  test("a move cannot leave the grid the month draws", () => {
    // Sunday 4 October is the last cell of the last row: there is nowhere right
    // to go, and nothing is reported rather than a day the grid does not show.
    const changes = recorder()
    const october = day(30).add({ days: 4 })
    const { container } = view({ onEventChange: changes.onEventChange }, [
      { ...KICKOFF, start: at(october, 10), end: at(october, 11, 30) },
    ])
    const chip = chipOf(container, "kickoff")

    act(() => chip?.focus())
    fireEvent.keyDown(chip as HTMLElement, { key: "ArrowRight" })
    expect(changes.calls).toHaveLength(0)

    fireEvent.keyDown(chip as HTMLElement, { key: "ArrowUp" })
    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(next.start.month).toBe(9)
    expect(next.start.day).toBe(27)
  })

  test("a pointer drag previews, then reports the drop once", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    stubGrid(container)

    const ghost = () => container.querySelector('[data-slot="month-move-preview"]')

    // Row 2, column 2: the cell the 16th is drawn in.
    pointer("pointerDown", chipOf(container, "kickoff") as HTMLElement, 250, 250)
    expect(ghost()).toBeNull()

    // Two columns right, same row.
    pointer("pointerMove", window, 450, 250)
    expect(ghost()).not.toBeNull()
    expect(changes.calls).toHaveLength(0)

    pointer("pointerUp", window, 450, 250)
    expect(ghost()).toBeNull()
    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(next.start.day).toBe(18)
    expect(next.start.hour).toBe(10)
    expect(minutes(next)).toBe(90)
  })

  test("a drag down a row is a week, and the time of day is untouched", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    stubGrid(container)

    pointer("pointerDown", chipOf(container, "kickoff") as HTMLElement, 250, 250)
    pointer("pointerMove", window, 250, 250 + WEEK_HEIGHT)
    pointer("pointerUp", window, 250, 250 + WEEK_HEIGHT)

    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(next.start.day).toBe(23)
    expect(next.start.hour).toBe(10)
    expect(next.start.minute).toBe(0)
  })

  test("the ghost takes the lane the drop would give it", () => {
    // The 18th already holds a 09:00 standup, so the chip dropped on it is
    // packed into the second lane rather than over the top of that one.
    const standup: CalendarEvent = {
      id: "standup",
      title: "Standup",
      start: at(day(18), 9),
      end: at(day(18), 9, 15),
    }
    const { container } = view({ onEventChange: recorder().onEventChange }, [KICKOFF, standup])
    stubGrid(container)

    pointer("pointerDown", chipOf(container, "kickoff") as HTMLElement, 250, 250)
    pointer("pointerMove", window, 450, 250)

    const ghost = container.querySelector<HTMLElement>('[data-slot="month-move-preview"]')
    expect(ghost).not.toBeNull()
    // Row 2, plus the 28px date line, plus one 22px lane.
    expect(ghost?.style.top).toBe(`${2 * WEEK_HEIGHT + 28 + 22}px`)
    // Column 4 of seven — Friday the 18th.
    expect(Number.parseFloat(ghost?.style.left ?? "")).toBeCloseTo((4 / 7) * 100, 6)

    // And the chip already there did not move while the drag was in flight —
    // a movable chip is positioned by the wrapper that carries the gesture.
    expect(
      chipOf(container, "standup")?.closest<HTMLElement>('[data-slot="calendar-event-move"]')
        ?.style.top,
    ).toBe("28px")
  })

  test("either half of a chip the week cut can be picked up", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange }, [TRIP])
    const chips = chipsOf(container, "trip")
    expect(chips).toHaveLength(2)

    // The second half starts on the Monday its row starts on, which is not the
    // event's own start — but a day of travel is a day of travel either way.
    act(() => chips[1]?.focus())
    fireEvent.keyDown(chips[1] as HTMLElement, { key: "ArrowRight" })

    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(next.start.day).toBe(19)
    expect(next.end.day).toBe(23)
  })

  test("a click still selects, and reports no move", async () => {
    const changes = recorder()
    const clicked: string[] = []
    const { container } = view({
      onEventChange: changes.onEventChange,
      onEventClick: (event) => clicked.push(event.id),
    })

    await userEvent.click(chipOf(container, "kickoff") as HTMLElement)

    expect(clicked).toEqual(["kickoff"])
    expect(changes.calls).toHaveLength(0)
  })

  test("nothing moves without onEventChange, or without isEventEditable", () => {
    const { container } = view({ isEventEditable: true, onEventChange: undefined })
    expect(container.querySelector('[data-slot="calendar-event-move"]')).toBeNull()

    const { container: second } = view({
      isEventEditable: false,
      onEventChange: recorder().onEventChange,
    })
    expect(second.querySelector('[data-slot="calendar-event-move"]')).toBeNull()
  })

  test("the predicate decides event by event", () => {
    const { container } = view(
      {
        isEventEditable: (event) => event.id === "kickoff",
        onEventChange: recorder().onEventChange,
      },
      [KICKOFF, { ...KICKOFF, id: "other", title: "Other", start: at(day(17), 9), end: at(day(17), 10) }],
    )

    expect(chipOf(container, "kickoff")?.closest('[data-slot="calendar-event-move"]')).not.toBeNull()
    expect(chipOf(container, "other")?.closest('[data-slot="calendar-event-move"]')).toBeNull()
  })

  test("the gesture is described, and every landing is announced", () => {
    const changes = recorder()
    const { container, getByRole } = view({ onEventChange: changes.onEventChange })
    const chip = chipOf(container, "kickoff")

    const hint = chip?.getAttribute("aria-describedby")
    expect(hint).toBeTruthy()
    expect(container.querySelector(`#${hint}`)?.textContent).toContain("arrow keys")

    act(() => chip?.focus())
    fireEvent.keyDown(chip as HTMLElement, { key: "ArrowRight" })

    // The date it landed on, in words, in a polite region — the ghost is a
    // picture and a picture is not a channel every reader has.
    expect(getByRole("status").textContent).toContain("17. September")
  })
})
