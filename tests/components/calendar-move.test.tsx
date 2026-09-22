/**
 * Dragging a calendar event to another time or another day (task #182).
 *
 * The feature is three things stacked, and this file takes them in that order:
 *
 * 1. **The inverse of `toTop`.** `offsetOfMinutes` turns minutes into pixels
 *    and every view positions with it; `minutesFromOffset` turns a drop back
 *    into minutes, snapped to the slot grid and clamped so the *whole* block
 *    lands inside the hours the axis draws. Those are pure functions and they
 *    are tested as such, including the round trip — a block dropped where it
 *    was picked up has to read back as the minute it started on.
 * 2. **The day a drag lands on.** Blocks live in a wrapper per day, so a drag
 *    that leaves its column is only answerable against the one container all
 *    seven share. `dayIndexAtOffset` is that hit test.
 * 3. **The hand-off.** `onEventChange` fires once, on drop, with the duration
 *    preserved — and never as the tail of a plain click, which still selects.
 *    Both input paths are exercised, because `useMove` is in the component for
 *    the keyboard as much as for the pointer: an event that can only be moved
 *    by dragging cannot be moved by everyone.
 * 4. **The column it lands in.** `packAgainst` asks the packing where one more
 *    block would go, which is the question a ghost asks: it is not in the
 *    events array, so `packColumns` has nothing to say about it until the drop
 *    has already happened.
 * 5. **What the ghost is a picture of.** It is drawn across the whole grid, so
 *    its rectangle is its day's slice of that grid narrowed by the column the
 *    drop would pack it into — and a ghost the full width of its day promised
 *    a width the drop then took away, over the top of the very blocks it was
 *    about to be packed beside. The percentages are asserted, because they are
 *    the only thing the reader sees.
 *
 * Every assertion pins locale, zone, date and axis, so nothing here depends on
 * the machine running it.
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
import {
  type CalendarAxis,
  type CalendarEvent,
  type CalendarEventChange,
  dayIndexAtOffset,
  minutesFromOffset,
  offsetOfMinutes,
} from "../../src/components/calendar-shell"
import { type DaySegment, packAgainst, packColumns } from "../../src/lib/calendar"
import { WeekView } from "../../src/components/week-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture week the other calendar suites use. */
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), ZONE)

/** 08:00–20:00 at 48px an hour, snapping to the half hour. */
const AXIS: CalendarAxis = { startHour: 8, endHour: 20, hourHeight: 48, slotMinutes: 30 }

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

describe("minutesFromOffset", () => {
  test("is the inverse of offsetOfMinutes", () => {
    for (const minutes of [480, 570, 720, 1020, 1200]) {
      expect(minutesFromOffset(offsetOfMinutes(minutes, AXIS), AXIS)).toBe(minutes)
    }
  })

  test("snaps to the nearest slot line", () => {
    const nineThirty = offsetOfMinutes(570, AXIS)
    // Ten pixels is twelve and a half minutes: not yet half of the 30 the grid
    // draws, so the block stays on the line it was on.
    expect(minutesFromOffset(nineThirty + 10, AXIS)).toBe(570)
    // Fourteen is seventeen and a half, which is over the line.
    expect(minutesFromOffset(nineThirty + 14, AXIS)).toBe(600)
    expect(minutesFromOffset(nineThirty - 14, AXIS)).toBe(540)
  })

  test("follows the hour when there are no sub-slot lines", () => {
    const hourly: CalendarAxis = { ...AXIS, slotMinutes: 0 }
    expect(minutesFromOffset(offsetOfMinutes(555, hourly), hourly)).toBe(540)
    expect(minutesFromOffset(offsetOfMinutes(585, hourly), hourly)).toBe(600)
  })

  test("clamps to the drawn axis at both ends", () => {
    expect(minutesFromOffset(-5000, AXIS)).toBe(8 * 60)
    expect(minutesFromOffset(5000, AXIS)).toBe(20 * 60)
  })

  test("clamps so the whole block lands inside the axis, on a line", () => {
    // An hour-long event cannot start at 20:00 and its last legal start is the
    // last *line* it fits behind.
    expect(minutesFromOffset(5000, AXIS, 60)).toBe(19 * 60)
    // Forty-five minutes would fit from 19:15, but 19:15 is not a line.
    expect(minutesFromOffset(5000, AXIS, 45)).toBe(19 * 60)
    // Nothing fits, so the block pins to the top rather than to a negative hour.
    expect(minutesFromOffset(5000, AXIS, 15 * 60)).toBe(8 * 60)
  })
})

/** A day segment at clock minutes, for the packing `packAgainst` has to agree with. */
const daySegment = (id: string, start: number, end: number): DaySegment => ({
  event: { id, title: id, start: at(MONDAY, 0), end: at(MONDAY, 1) },
  dayIndex: 0,
  start,
  end,
  continuesBefore: false,
  continuesAfter: false,
})

describe("packAgainst", () => {
  test("an empty day gives the whole column", () => {
    expect(packAgainst([], { start: 600, end: 660 })).toEqual({ column: 0, columns: 1, span: 1 })
  })

  test("a free hour beside a busy one is still the whole column", () => {
    // 09:00–10:00 is taken; the ghost at 10:00 touches it and no more, so the
    // two are separate clusters and neither is narrowed. Touching is not
    // overlapping — the same comparison `packIntervals` is pinned on above.
    expect(packAgainst([{ start: 540, end: 600 }], { start: 600, end: 660 })).toEqual({
      column: 0,
      columns: 1,
      span: 1,
    })
  })

  test("a collision puts the ghost in the column the drop would give it", () => {
    const neighbours = [{ start: 600, end: 690 }]
    expect(packAgainst(neighbours, { start: 630, end: 720 })).toEqual({
      column: 1,
      columns: 2,
      span: 1,
    })
    // And that is what `packColumns` says once the event is really there —
    // 10:00–11:30 and 10:30–12:00 are the fixture week's Thursday, which is
    // where this was reported from.
    const packed = packColumns([
      daySegment("design", 600, 690),
      daySegment("focus", 630, 720),
    ])
    expect(packed[1]).toMatchObject({ column: 1, columns: 2, span: 1 })
  })

  test("the ghost widens into a column that is free beside it", () => {
    // The `packColumns` case above, asked one interval early: a 09:00–12:00
    // block and two 09:00–10:00 ones force three columns, and a ghost at 10:30
    // takes the second and widens into the third.
    const neighbours = [
      { start: 540, end: 720 },
      { start: 540, end: 600 },
      { start: 540, end: 600 },
    ]
    expect(packAgainst(neighbours, { start: 630, end: 660 })).toEqual({
      column: 1,
      columns: 3,
      span: 2,
    })
  })

  test("a ghost shorter than the renderer draws is packed at that minimum", () => {
    // The inflation `packColumns` applies, applied to both sides: a zero-length
    // drop onto a 10:00 meeting is drawn 18 pixels tall on top of it, so it is
    // packed beside it rather than underneath it.
    expect(packAgainst([{ start: 600, end: 660 }], { start: 600, end: 600 })).toEqual({
      column: 1,
      columns: 2,
      span: 1,
    })
    expect(packAgainst([{ start: 600, end: 600 }], { start: 605, end: 665 })).toEqual({
      column: 1,
      columns: 2,
      span: 1,
    })
  })

  test("minMinutes is the renderer's, so a caller that draws smaller can say so", () => {
    expect(
      packAgainst([{ start: 600, end: 601 }], { start: 602, end: 660 }, { minMinutes: 0 }),
    ).toEqual({ column: 0, columns: 1, span: 1 })
  })
})

describe("dayIndexAtOffset", () => {
  const WIDTH = 700

  test("reads the column the pointer is over", () => {
    expect(dayIndexAtOffset(0, WIDTH, 7)).toBe(0)
    expect(dayIndexAtOffset(250, WIDTH, 7)).toBe(2)
    expect(dayIndexAtOffset(699, WIDTH, 7)).toBe(6)
  })

  test("clamps to the edge a drag left by", () => {
    expect(dayIndexAtOffset(-400, WIDTH, 7)).toBe(0)
    expect(dayIndexAtOffset(4000, WIDTH, 7)).toBe(6)
  })

  test("answers zero when there is nothing to hit-test against", () => {
    expect(dayIndexAtOffset(300, 0, 7)).toBe(0)
    expect(dayIndexAtOffset(300, WIDTH, 1)).toBe(0)
  })
})

describe("WeekView move", () => {
  /** Wednesday 16:00–18:00 — the block the report was filed against. */
  const DEPLOY: CalendarEvent = {
    id: "deploy",
    title: "Deploy window",
    start: at(MONDAY.add({ days: 2 }), 16),
    end: at(MONDAY.add({ days: 2 }), 18),
  }

  /** Runs past the last hour drawn, so the grid only ever shows a slice of it. */
  const EVENING: CalendarEvent = {
    id: "evening",
    title: "Long evening",
    start: at(MONDAY, 19),
    end: at(MONDAY, 21),
  }

  const view = (
    extra: Partial<React.ComponentProps<typeof WeekView>> = {},
    events: CalendarEvent[] = [DEPLOY],
  ) =>
    render(
      <WeekView
        date={MONDAY}
        events={events}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        showToolbar={false}
        startHour={AXIS.startHour}
        endHour={AXIS.endHour}
        hourHeight={AXIS.hourHeight}
        slotMinutes={AXIS.slotMinutes}
        isEventEditable
        {...extra}
      />,
    )

  const blockOf = (container: HTMLElement, id: string) =>
    container.querySelector<HTMLElement>(`[data-slot="calendar-event"][data-event-id="${id}"]`)

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

  test("an arrow key moves the focused event one slot, once", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    const block = blockOf(container, "deploy")
    expect(block).not.toBeNull()

    // Focus is a state update in react-aria's focus ring, so it is the test's
    // to wrap; `fireEvent` wraps its own.
    act(() => block?.focus())
    fireEvent.keyDown(block as HTMLElement, { key: "ArrowDown" })

    expect(changes.calls).toHaveLength(1)
    const [event, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(event.id).toBe("deploy")
    expect(next.start.hour).toBe(16)
    expect(next.start.minute).toBe(30)
    expect(minutes(next)).toBe(120)
    // Week columns are days, so there is no calendar to report landing on.
    expect(next.calendarId).toBeUndefined()
  })

  test("left and right move it a whole day, at the same time", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    const block = blockOf(container, "deploy")

    // Focus is a state update in react-aria's focus ring, so it is the test's
    // to wrap; `fireEvent` wraps its own.
    act(() => block?.focus())
    fireEvent.keyDown(block as HTMLElement, { key: "ArrowRight" })

    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    // Wednesday the 23rd to Thursday the 24th, still at four.
    expect(next.start.day).toBe(24)
    expect(next.start.hour).toBe(16)
    expect(minutes(next)).toBe(120)
  })

  test("a pointer drag previews, then reports the drop once", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange })
    const grid = container.querySelector<HTMLElement>('[data-slot="calendar-grid"]')
    expect(grid).not.toBeNull()
    // happy-dom lays nothing out, so the one box the hit test needs is stubbed:
    // seven columns of a hundred pixels each.
    if (grid) {
      grid.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 700, height: 576, right: 700, bottom: 576, x: 0, y: 0 }) as DOMRect
    }

    const block = blockOf(container, "deploy")
    const ghost = () => container.querySelector('[data-slot="calendar-move-preview"]')

    pointer("pointerDown", block as HTMLElement, 250, 300)
    expect(ghost()).toBeNull()

    // Two columns right and 24 pixels down: half an hour on a 48px hour.
    pointer("pointerMove", window, 450, 324)
    expect(ghost()?.textContent).toContain("16:30")
    expect(changes.calls).toHaveLength(0)

    pointer("pointerUp", window, 450, 324)
    expect(ghost()).toBeNull()
    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    // x=450 is the fifth column: Friday the 25th.
    expect(next.start.day).toBe(25)
    expect(next.start.hour).toBe(16)
    expect(next.start.minute).toBe(30)
    expect(minutes(next)).toBe(120)
  })

  test("a click still selects, and reports no move", async () => {
    const changes = recorder()
    const clicked: string[] = []
    const { container } = view({
      onEventChange: changes.onEventChange,
      onEventClick: (event) => clicked.push(event.id),
    })

    await userEvent.click(blockOf(container, "deploy") as HTMLElement)

    expect(clicked).toEqual(["deploy"])
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
        isEventEditable: (event) => event.id === "deploy",
        onEventChange: recorder().onEventChange,
      },
      [DEPLOY, { ...DEPLOY, id: "other", start: at(MONDAY, 9), end: at(MONDAY, 10) }],
    )

    expect(blockOf(container, "deploy")?.closest('[data-slot="calendar-event-move"]')).not.toBeNull()
    expect(blockOf(container, "other")?.closest('[data-slot="calendar-event-move"]')).toBeNull()
  })

  test("a block the axis cut is not the event, so it does not move", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange }, [EVENING])
    const block = blockOf(container, "evening")

    expect(block).not.toBeNull()
    expect(block?.closest('[data-slot="calendar-event-move"]')).toBeNull()

    // Focus is a state update in react-aria's focus ring, so it is the test's
    // to wrap; `fireEvent` wraps its own.
    act(() => block?.focus())
    fireEvent.keyDown(block as HTMLElement, { key: "ArrowDown" })
    expect(changes.calls).toHaveLength(0)
  })

  /** The one box the hit test needs: seven columns of a hundred pixels. */
  const stubGrid = (container: HTMLElement) => {
    const grid = container.querySelector<HTMLElement>('[data-slot="calendar-grid"]')
    expect(grid).not.toBeNull()
    if (grid) {
      grid.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 700, height: 576, right: 700, bottom: 576, x: 0, y: 0 }) as DOMRect
    }
  }

  /** The ghost's geometry as numbers — `left` and `width` are both percentages. */
  const ghostBox = (container: HTMLElement) => {
    const ghost = container.querySelector<HTMLElement>('[data-slot="calendar-move-preview"]')
    if (!ghost) return null
    return {
      column: Number(ghost.dataset.column),
      columns: Number(ghost.dataset.columns),
      left: Number.parseFloat(ghost.style.left),
      width: Number.parseFloat(ghost.style.width.replace("calc(", "")),
    }
  }

  /** A seven-day week: one column is this much of the grid. */
  const DAY = 100 / 7

  test("the ghost is packed against the day it is over", () => {
    // Friday already holds a 15:00–18:00 meeting, and the drop lands inside it.
    const friday: CalendarEvent = {
      id: "workshop",
      title: "Workshop",
      start: at(MONDAY.add({ days: 4 }), 15),
      end: at(MONDAY.add({ days: 4 }), 18),
    }
    const { container } = view({ onEventChange: recorder().onEventChange }, [DEPLOY, friday])
    stubGrid(container)

    pointer("pointerDown", blockOf(container, "deploy") as HTMLElement, 250, 300)
    // Two columns right, same hour: Wednesday 16:00 to Friday 16:00.
    pointer("pointerMove", window, 450, 300)

    const box = ghostBox(container)
    // The longer meeting takes the left column; the ghost takes the right one,
    // at half the day — which is the width the block has after the drop.
    expect(box?.columns).toBe(2)
    expect(box?.column).toBe(1)
    expect(box?.left).toBeCloseTo(4.5 * DAY, 6)
    expect(box?.width).toBeCloseTo(DAY / 2, 6)

    pointer("pointerUp", window, 450, 300)
    const block = blockOf(container, "workshop")
    // And the block already there did not move while the drag was in flight.
    expect(block?.closest<HTMLElement>('[data-slot="calendar-event-move"]')?.style.width).toBe(
      "calc(100% - 2px)",
    )
  })

  test("a day with nothing on it gives the ghost the whole column", () => {
    const { container } = view({ onEventChange: recorder().onEventChange }, [DEPLOY])
    stubGrid(container)

    pointer("pointerDown", blockOf(container, "deploy") as HTMLElement, 250, 300)
    pointer("pointerMove", window, 450, 300)

    const box = ghostBox(container)
    expect(box?.columns).toBe(1)
    expect(box?.left).toBeCloseTo(4 * DAY, 6)
    expect(box?.width).toBeCloseTo(DAY, 6)
  })

  test("the event being dragged is not in its own way", () => {
    // Half an hour down its own day: 16:00–18:00 overlaps 16:30–18:30 on the
    // number line, and packing the ghost against the block it *is* would halve
    // it for a move that displaces nothing.
    const { container } = view({ onEventChange: recorder().onEventChange }, [DEPLOY])
    stubGrid(container)

    pointer("pointerDown", blockOf(container, "deploy") as HTMLElement, 250, 300)
    pointer("pointerMove", window, 250, 324)

    const box = ghostBox(container)
    expect(box?.columns).toBe(1)
    expect(box?.left).toBeCloseTo(2 * DAY, 6)
    expect(box?.width).toBeCloseTo(DAY, 6)
  })

  test("a move cannot leave the drawn axis", () => {
    const changes = recorder()
    const { container } = view({ onEventChange: changes.onEventChange }, [
      { ...DEPLOY, start: at(MONDAY.add({ days: 2 }), 18), end: at(MONDAY.add({ days: 2 }), 20) },
    ])
    const block = blockOf(container, "deploy")

    // Focus is a state update in react-aria's focus ring, so it is the test's
    // to wrap; `fireEvent` wraps its own.
    act(() => block?.focus())
    // 18:00–20:00 already ends on the last line, so there is nowhere down to go
    // and the press reports nothing rather than reporting a block half of which
    // the grid cannot draw.
    fireEvent.keyDown(block as HTMLElement, { key: "ArrowDown" })
    expect(changes.calls).toHaveLength(0)

    fireEvent.keyDown(block as HTMLElement, { key: "ArrowUp" })
    expect(changes.calls).toHaveLength(1)
    const [, next] = changes.calls[0] as [CalendarEvent, CalendarEventChange]
    expect(next.start.hour).toBe(17)
    expect(next.start.minute).toBe(30)
  })
})
