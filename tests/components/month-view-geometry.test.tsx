/**
 * The seam between a month cell's date line and the first lane of chips.
 *
 * A month cell is drawn in two pieces that never meet in the layout: the date
 * line is in flow at the top of the cell, and the chips are absolutely
 * positioned over the whole week row at `CELL_HEADER + lane * LANE_HEIGHT`. So
 * nothing makes them agree except the number — and when the number was smaller
 * than the date line really is, every lane-0 chip was drawn two pixels into the
 * day number underneath it. Invisible on a plain number, obvious on today,
 * whose circle is filled.
 *
 * The fix is that `CELL_HEADER` is now the date line's *height* — the wrapper
 * is given it — rather than an estimate of it, so the two are one number. This
 * file pins the three things that keeps true:
 *
 * 1. The first lane starts at or below the bottom of the date line.
 * 2. That line's box is as tall as what is inside it: `pt-1` (4px) above a
 *    `h-6` (24px) button is 28, and the classes are checked with the number
 *    because Tailwind's arithmetic is the half of it a DOM test cannot compute.
 * 3. A default row still holds four lanes. The header is subtracted from
 *    `weekHeight` to derive the lane count, so growing it is one pixel away
 *    from quietly costing every default grid a lane.
 *
 * Locale, zone and date are pinned, so nothing here depends on the machine.
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
import type { CalendarEvent } from "../../src/components/calendar-shell"
import { MonthView } from "../../src/components/month-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Wednesday, 23 September 2026 — the day the grids below call today. */
const TODAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-23T00:00[${ZONE}]`))

const day = (date: number) => TODAY.set({ day: date })
const at = (date: CalendarDate, hour: number) =>
  toZoned(toCalendarDateTime(date, new Time(hour)), ZONE)

/** All day on today itself: a lane-0 chip over the one cell that draws a circle. */
const OFFSITE: CalendarEvent = {
  id: "offsite",
  title: "Offsite",
  start: at(day(22), 0),
  end: at(day(25), 0),
  allDay: true,
}

const view = (events: CalendarEvent[], props: Partial<React.ComponentProps<typeof MonthView>> = {}) =>
  render(
    <MonthView
      date={TODAY}
      events={events}
      locale={LOCALE}
      timeZone={ZONE}
      now={TODAY}
      showToolbar={false}
      {...props}
    />,
  )

/** The box the date number sits in — the wrapper the day button is the child of. */
const dateLine = (dayNumber: string) => {
  const button = screen.getByRole("button", { name: dayNumber })
  const box = button.parentElement
  if (!box) throw new Error(`the ${dayNumber} has no date line around it`)
  return { button, box }
}

const pixels = (value: string) => Number.parseFloat(value)

describe("the month cell's header band", () => {
  test("a lane-0 chip starts below the date line rather than inside it", () => {
    const { container } = view([OFFSITE])

    const { box } = dateLine("23")
    const chip = container.querySelector<HTMLElement>('[data-slot="calendar-chip"]')
    if (!chip) throw new Error("no chip was drawn")

    expect(pixels(chip.style.top)).toBeGreaterThanOrEqual(pixels(box.style.height))
  })

  test("the date line's box is as tall as what is in it", () => {
    view([])

    const { button, box } = dateLine("23")

    // 4px of padding above a 24px button. Change either and this number moves
    // with it — the chips are placed by the number, not by the layout.
    expect(box.className).toContain("pt-1")
    expect(button.className).toContain("h-6")
    expect(box.style.height).toBe("28px")
  })

  test("a default row still holds four lanes", () => {
    const { container } = view(
      Array.from({ length: 4 }, (_, index) => ({
        id: `slot-${index}`,
        title: `Interview ${index + 1}`,
        start: at(TODAY, 9 + index),
        end: at(TODAY, 10 + index),
      })),
    )

    expect(container.querySelectorAll('[data-slot="calendar-chip"]')).toHaveLength(4)
    expect(screen.queryByText(/more/)).toBeNull()
  })
})
