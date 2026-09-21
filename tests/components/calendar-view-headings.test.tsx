/**
 * What the toolbar's heading is, on each of the views that draws one.
 *
 * `calendar-toolbar.test.tsx` covers the toolbar in isolation — that the picker
 * reports a choice and closes behind it, and that a week grid is laid out in the
 * locale and first-day it is given. This file is about the wiring above that:
 * which grid each view asks for, and that it asks for one at all.
 *
 * The heading is a picker by default because the alternative was Today or one
 * chevron press at a time, which is not a way to reach next March. It opens the
 * unit the heading is spelled in: a day for Day View, a week for Week View,
 * whose heading reads `21.–27. September 2026` and whose seven columns are the
 * same whichever day of that row you pick.
 *
 * Dates and locales are pinned, so nothing here depends on the machine.
 */
import { describe, expect, test } from "bun:test"
import { CalendarDate } from "@internationalized/date"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DayView } from "../../src/components/day-view"
import { WeekView } from "../../src/components/week-view"

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"

/** Monday, 21 September 2026 — the fixture week the calendar suites share. */
const MONDAY = new CalendarDate(2026, 9, 21)

const heading = (container: HTMLElement) =>
  container.querySelector('[data-slot="calendar-toolbar-label"]') as HTMLElement

describe("Week View's heading", () => {
  test("is a week picker, and picking a week moves the view", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <WeekView defaultDate={MONDAY} events={[]} locale={LOCALE} timeZone={ZONE} now={null} />,
    )

    expect(heading(container).tagName).toBe("BUTTON")

    await user.click(heading(container))

    // Weeks, not days: a day grid would ask which of the seven you meant when
    // all seven show the same view.
    const weeks = screen.getAllByRole("option")
    expect(weeks.every((row) => row.getAttribute("aria-label")?.startsWith("Week "))).toBe(true)

    // Two rows into a grid whose first row is the week of 31 August: 14–20
    // September, the week before the fixture one.
    await user.click(weeks[2] as HTMLElement)

    const columns = container.querySelectorAll('[data-slot="calendar-day-header"]')
    expect(columns[0]?.textContent).toContain("14")
    expect(columns[6]?.textContent).toContain("20")
  })

  test("can be a day grid instead, for a reader who is choosing a day", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <WeekView
        defaultDate={MONDAY}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        pickerGranularity="day"
      />,
    )

    await user.click(heading(container))

    expect(screen.getByRole("application")).toBeInTheDocument()
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })

  test('goes back to plain text with labelVariant="static"', () => {
    const { container } = render(
      <WeekView
        defaultDate={MONDAY}
        events={[]}
        locale={LOCALE}
        timeZone={ZONE}
        now={null}
        labelVariant="static"
      />,
    )

    expect(heading(container).tagName).toBe("SPAN")
  })
})

describe("Day View's heading", () => {
  test("opens a day grid", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DayView defaultDate={MONDAY} events={[]} locale={LOCALE} timeZone={ZONE} now={null} />,
    )

    expect(heading(container).tagName).toBe("BUTTON")
    expect(screen.queryByRole("application")).toBeNull()

    await user.click(heading(container))

    // A day view is anchored on a day, so a day is what its heading offers.
    expect(screen.getByRole("application")).toBeInTheDocument()
  })
})
