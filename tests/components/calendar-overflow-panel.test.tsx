/**
 * What a "+N more" opens (task #177).
 *
 * The overflow link used to be a callback hook with no UI: a bare button whose
 * whole behaviour was `onMoreClick?.()`, so an app that passed no callback
 * shipped an affordance that did nothing — and, having no `aria-expanded`, did
 * nothing to a screen reader either. It is a popover now, and the rule that
 * keeps the old hook working is the one worth pinning: **`onMoreClick` suppresses
 * the panel**, because supplying it is how a consumer says the interaction is
 * theirs.
 *
 * `tests/components/calendar-views.test.tsx` proves the packing reaches the DOM;
 * this file proves what happens when you press what the packing drew. Both views
 * that have an overflow are covered, because the month grid and the all-day band
 * share the link and must not drift apart on it.
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
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CalendarEvent, CalendarSource } from "../../src/components/calendar-shell"
import { MonthView } from "../../src/components/month-view"
import { WeekView } from "../../src/components/week-view"

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

/** Six on one day: 116px rows hold four lanes, so three draw and three hide. */
const crowd: CalendarEvent[] = Array.from({ length: 6 }, (_, index) => ({
  id: `slot-${index}`,
  title: `Interview ${index + 1}`,
  start: at(MONDAY, 9 + index),
  end: at(MONDAY, 10 + index),
  calendarId: "team",
}))

const moreLink = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="calendar-more"]') as HTMLElement

describe("the month grid's overflow", () => {
  test("with no onMoreClick the link opens a panel listing the whole day", async () => {
    const clicked: string[] = []
    const { container } = render(
      <MonthView
        date={MONDAY}
        events={crowd}
        calendars={CALENDARS}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        onEventClick={(event) => clicked.push(event.id)}
      />,
    )

    const more = moreLink(container)
    expect(more.dataset.moreCount).toBe("3")
    // To a screen reader the old link was a button that did nothing. This
    // attribute is the whole difference between that and an affordance — and it
    // is react-aria's to set, which is the argument for the overlay owning it.
    expect(more.getAttribute("aria-expanded")).toBe("false")

    const user = userEvent.setup()
    await user.click(more)

    const panel = await screen.findByRole("dialog")
    expect(more.getAttribute("aria-expanded")).toBe("true")
    // Six on the day, three of them drawn in the cell: the panel is the day,
    // not the remainder. It is the payload `onMoreClick` always got.
    expect(panel.querySelectorAll('[data-slot="calendar-day-event"]')).toHaveLength(6)
    // Dated, so the panel says which day it is answering for.
    expect(panel.textContent).toContain("September")

    // "Interview 6" is one of the hidden ones, so the panel is the only place
    // it can be pressed from.
    await user.click(within(panel).getByText("Interview 6"))
    expect(clicked).toEqual(["slot-5"])
    // The question it was opened to ask has been answered, so the panel goes
    // and the trigger has focus back.
    await waitFor(() => expect(more.getAttribute("aria-expanded")).toBe("false"))
    expect(document.activeElement).toBe(more)
  })

  test("supplying onMoreClick suppresses the panel — the consumer owns the link", async () => {
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

    const more = moreLink(container)
    // No overlay behind it at all, which is what "the link is yours" means.
    expect(more.getAttribute("aria-expanded")).toBeNull()

    await userEvent.setup().click(more)
    expect(opened).toEqual([6])
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("the all-day band's overflow", () => {
  test("opens the same panel the month grid does", async () => {
    // Two lanes by default and the last is spent on the link, so three all-day
    // events on one day draw one and hide two.
    const holidays: CalendarEvent[] = Array.from({ length: 3 }, (_, index) => ({
      id: `hol-${index}`,
      title: `Holiday ${index + 1}`,
      start: at(MONDAY, 0),
      end: at(MONDAY.add({ days: 1 }), 0),
      allDay: true,
    }))
    const clicked: string[] = []
    const { container } = render(
      <WeekView
        date={MONDAY}
        events={holidays}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        onEventClick={(event) => clicked.push(event.id)}
      />,
    )

    const more = moreLink(container)
    expect(more.dataset.moreCount).toBe("2")

    const user = userEvent.setup()
    await user.click(more)
    const panel = await screen.findByRole("dialog")
    expect(panel.querySelectorAll('[data-slot="calendar-day-event"]')).toHaveLength(3)

    await user.click(within(panel).getByText("Holiday 3"))
    expect(clicked).toEqual(["hol-2"])
  })

  /**
   * And draws the rows the way the grid draws them.
   *
   * A filled row carries the 2px colour accent down its left edge, and
   * `--radius-quebi-sm` is 8px on a 20px row — so a radius on that side bends
   * the accent into a crescent hooked into a pill, which is the defect
   * `tests/components/calendar-surfaces.test.tsx` pins for the chip and the
   * band (task #176). The panel was the surface it survived on, because the
   * radius used to arrive from this call site instead of from the row.
   */
  test("a filled row in the panel is square on the accented edge", async () => {
    const holiday: CalendarEvent = {
      id: "hol",
      title: "Holiday",
      start: at(MONDAY, 0),
      end: at(MONDAY.add({ days: 1 }), 0),
      allDay: true,
    }
    const { container } = render(
      <WeekView
        date={MONDAY}
        events={[holiday, { ...holiday, id: "hol-2" }, { ...holiday, id: "hol-3" }]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
      />,
    )

    await userEvent.setup().click(moreLink(container))
    const panel = await screen.findByRole("dialog")
    const row = panel.querySelector<HTMLElement>('[data-slot="calendar-day-event"]')
    const className = row?.className ?? ""

    expect(className).toContain("border-l-2")
    expect(className).toContain("rounded-l-none")
    // The radius is the row's own, so there is nothing here to get wrong — and
    // the trailing corners keep it.
    expect(className).toContain("rounded-quebi-sm")
    expect(className).not.toContain("rounded-l-quebi-sm")
  })
})
