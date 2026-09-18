/**
 * What the select header's month picker is allowed to offer.
 *
 * `setFocusedDate` runs through react-aria's `focusCell`, which clamps the move
 * to `minValue`/`maxValue`. So an out-of-range month is not inert: picking it
 * snaps focus to the nearest legal date and leaves the header naming a month
 * nobody chose, which reads as a control that ignored the click. Everything
 * below is that rule — a month the bounds cannot reach is not selectable, and a
 * month they reach only in part lands on the first day of it that is legal.
 *
 * Until task #160 the header was a month `Select` beside a year `Select`, and
 * those answered the same question by *dropping* the unreachable entries: a
 * booking calendar open for a year would otherwise have spent 39 of its 41 year
 * rows on years nobody could pick. A grid has no such problem — twelve cells
 * are twelve cells whether or not four of them are dim — so the answer here is
 * `aria-disabled`, and the assertions below say so rather than counting rows.
 * The dropdowns are still exported and still behave the old way; the last
 * describe is what keeps that true.
 *
 * Dates are pinned to a fixed month rather than `today()`, so a run in December
 * does not read differently from a run in June.
 */
import { CalendarDate } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
// biome-ignore lint/style/noRestrictedImports: the deprecated SelectMonth/SelectYear only resolve inside a react-aria Calendar, and ours no longer renders them — a bare primitive is the only place left that can exercise them.
import { Calendar as CalendarPrimitive } from "react-aria-components"
import { Calendar, SelectMonth, SelectYear } from "../../src/components/calendar"
import { RangeCalendar } from "../../src/components/range-calendar"

const JUNE = new CalendarDate(2026, 6, 15)

/**
 * The trigger that opens the grid. Its accessible name is the month and year it
 * is showing, so there is nothing constant to query it by — `data-slot` is the
 * stable handle, here and for a consumer restyling the header.
 */
const trigger = () => {
  const element = document.querySelector<HTMLElement>('[data-slot="calendar-month-year"]')
  if (!element) throw new Error("no month/year trigger")
  return element
}

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(trigger())
}

/** A month cell, by the `<long month> <year>` name Month Picker gives it. */
const monthCell = (name: string) => screen.getByRole("option", { name })

/** Every month cell on the page, in order. */
const monthCells = () =>
  screen.getAllByRole("option").map((option) => option.getAttribute("aria-label"))

/** The sr-only `<Heading>` react-aria fills with the visible range. */
const visibleRange = () => document.querySelector("h2")?.textContent ?? ""

/**
 * The day react-aria has focus parked on — the one cell in the grid with
 * `tabIndex=0`. It is how "the day survived the month change" is observable
 * from outside: `focusedDate` is state, but the roving tabindex is its shadow.
 */
const focusedDay = () => document.querySelector("table [tabindex='0']")?.textContent ?? ""

describe("the month picker in the header", () => {
  test("shows the focused month and year on the trigger", () => {
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(trigger().textContent).toContain("June")
    expect(trigger().textContent).toContain("2026")
  })

  test("opens a whole year of months, whatever the bounds", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={JUNE}
        maxValue={new CalendarDate(2026, 8, 20)}
      />,
    )

    await openPicker(user)

    expect(monthCells()).toHaveLength(12)
    expect(monthCells()[0]).toBe("January 2026")
  })

  test("disables the months the bounds cannot reach", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={JUNE}
        maxValue={new CalendarDate(2026, 8, 20)}
      />,
    )

    await openPicker(user)

    // A month counts as reachable when any day of it is: `minValue` is 15 June
    // and `maxValue` is 20 August, so all three of those months are live.
    for (const name of ["June 2026", "July 2026", "August 2026"]) {
      expect(monthCell(name)).not.toHaveAttribute("aria-disabled", "true")
    }
    for (const name of ["May 2026", "September 2026"]) {
      expect(monthCell(name)).toHaveAttribute("aria-disabled", "true")
    }
  })

  test("moves the visible month and keeps the day focus was on", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(focusedDay()).toBe("15")

    await openPicker(user)
    await user.click(monthCell("October 2026"))

    expect(visibleRange()).toContain("October")
    // The thing being chosen is a month, not a date. Month Picker reports the
    // first of it; the header puts focus on the same day of it instead, which
    // is what the old month dropdown's `set({ month })` did.
    expect(focusedDay()).toBe("15")
    expect(trigger().textContent).toContain("October")
  })

  test("closes on selection", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await openPicker(user)
    await user.click(monthCell("October 2026"))

    expect(screen.queryByRole("option")).toBeNull()
  })

  test("pages to another year without moving the calendar", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await openPicker(user)
    await user.click(screen.getByRole("button", { name: "Next year" }))

    expect(monthCells()[0]).toBe("January 2027")
    // Paging is not selecting.
    expect(visibleRange()).toContain("2026")

    await user.click(monthCell("March 2027"))

    expect(visibleRange()).toContain("March")
    expect(visibleRange()).toContain("2027")
  })

  test("lands inside the bounds when the month is only partly reachable", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={JUNE}
        maxValue={new CalendarDate(2027, 2, 10)}
      />,
    )

    await openPicker(user)
    await user.click(screen.getByRole("button", { name: "Next year" }))
    await user.click(monthCell("February 2027"))

    // 15 February 2027 is past `maxValue`, so focus lands on the 10th rather
    // than snapping back and leaving the trigger naming a month the calendar
    // is not on.
    expect(visibleRange()).toContain("February")
    expect(focusedDay()).toBe("10")
    expect(trigger().textContent).toContain("February")
  })

  test("goes dead with the calendar", () => {
    render(<Calendar aria-label="Locked calendar" defaultValue={JUNE} isDisabled />)

    expect(trigger()).toBeDisabled()
  })

  test("reaches the RangeCalendar through the shared header", async () => {
    const user = userEvent.setup()
    render(
      <RangeCalendar
        aria-label="Trip dates"
        defaultValue={{ start: JUNE, end: JUNE.add({ days: 5 }) }}
        minValue={JUNE}
        maxValue={JUNE.add({ years: 1 })}
      />,
    )

    await openPicker(user)

    expect(monthCell("June 2026")).not.toHaveAttribute("aria-disabled", "true")
    expect(monthCell("May 2026")).toHaveAttribute("aria-disabled", "true")
  })
})

/**
 * The header no longer renders these, and nothing in the library does — they
 * are exported for whoever built a header out of them before task #160. What is
 * pinned is that they still resolve their own state and still filter to the
 * reachable entries; the arguments behind both are in `calendar.tsx`.
 */
describe("the deprecated month and year dropdowns", () => {
  const dropdown = (label: string) => {
    const element = document.querySelector<HTMLElement>(`button[aria-label="${label}"]`)
    if (!element) throw new Error(`no ${label} dropdown`)
    return element
  }

  const openAndRead = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    await user.click(dropdown(label))
    return screen.getAllByRole("option").map((option) => option.textContent)
  }

  const Dropdowns = ({ minValue, maxValue }: { minValue?: CalendarDate; maxValue?: CalendarDate }) => (
    <CalendarPrimitive
      aria-label="Booking date"
      defaultValue={JUNE}
      minValue={minValue}
      maxValue={maxValue}
    >
      <SelectMonth />
      <SelectYear />
    </CalendarPrimitive>
  )

  test("the year dropdown keeps its ±20 window when nothing bounds it", async () => {
    const user = userEvent.setup()
    render(<Dropdowns />)

    const years = await openAndRead(user, "Year")
    expect(years).toHaveLength(41)
    expect(years[0]).toBe("2006")
    expect(years.at(-1)).toBe("2046")
  })

  test("both drop the entries the bounds cannot reach", async () => {
    const user = userEvent.setup()
    render(<Dropdowns minValue={JUNE} maxValue={new CalendarDate(2026, 8, 20)} />)

    expect(await openAndRead(user, "Month")).toEqual(["Jun", "Jul", "Aug"])
    await user.keyboard("{Escape}")
    expect(await openAndRead(user, "Year")).toEqual(["2026"])
  })
})
