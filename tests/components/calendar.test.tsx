/**
 * What the select header's dropdowns are allowed to offer.
 *
 * `setFocusedDate` runs through react-aria's `focusCell`, which clamps the move
 * to `minValue`/`maxValue`. So an out-of-range entry in the month or year
 * dropdown is not inert: picking it snaps focus to the nearest legal date and
 * re-renders the dropdown showing a year nobody chose, which reads as a control
 * that ignored the click. The tests below are the rule that prevents it — an
 * unreachable year is not in the collection at all (task #153).
 *
 * The second thing pinned here is the year window's anchor. It used to be
 * centred on `state.focusedDate`, so the list re-centred itself after every
 * pick and the row under the pointer meant a different year the second time.
 *
 * Dates are pinned to a fixed month rather than `today()`, so a run in December
 * does not read differently from a run in June.
 */
import { CalendarDate } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Calendar } from "../../src/components/calendar"
import { RangeCalendar } from "../../src/components/range-calendar"

const JUNE = new CalendarDate(2026, 6, 15)

/**
 * The Select triggers carry `aria-label` but are also `aria-labelledby` their
 * own value, so their accessible name is "Jun Month" and a role query by name
 * does not find them. The attribute is the stable thing to ask for.
 */
const dropdown = (label: string) => {
  const trigger = document.querySelector<HTMLElement>(`button[aria-label="${label}"]`)
  if (!trigger) throw new Error(`no ${label} dropdown`)
  return trigger
}

/** The labels the named dropdown offers, in order. Leaves the popover open. */
const openAndRead = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(dropdown(label))
  return screen.getAllByRole("option").map((option) => option.textContent)
}

/** The sr-only `<Heading>` react-aria fills with the visible range. */
const visibleRange = () => document.querySelector("h2")?.textContent ?? ""

describe("year dropdown", () => {
  test("offers only the years the bounds can reach", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={JUNE}
        maxValue={JUNE.add({ years: 1 })}
      />,
    )

    expect(await openAndRead(user, "Year")).toEqual(["2026", "2027"])
  })

  test("counts a year reachable when any day of it is", async () => {
    const user = userEvent.setup()
    // 31 December 2026 is the last legal date, so 2026 stays on the list while
    // a bound-as-a-date comparison against 1 January 2027 would have dropped it.
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={new CalendarDate(2026, 12, 31)}
        maxValue={new CalendarDate(2027, 1, 1)}
      />,
    )

    expect(await openAndRead(user, "Year")).toEqual(["2026", "2027"])
  })

  test("keeps a ±20 window when nothing bounds it", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    const years = await openAndRead(user, "Year")
    expect(years).toHaveLength(41)
    expect(years[0]).toBe("2006")
    expect(years.at(-1)).toBe("2046")
  })

  test("does not re-centre the window on the year just picked", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await user.click(dropdown("Year"))
    await user.click(screen.getByRole("option", { name: "2030" }))
    expect(visibleRange()).toContain("2030")

    // Anchored on the year the calendar opened on: the same rows, in the same
    // places, so a second pick from the same spot means the same year.
    const years = await openAndRead(user, "Year")
    expect(years[0]).toBe("2006")
    expect(years.at(-1)).toBe("2046")
  })

  test("picking a year keeps the month it was showing", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await user.click(dropdown("Year"))
    await user.click(screen.getByRole("option", { name: "2030" }))

    expect(visibleRange()).toContain("2030")
    expect(dropdown("Month").textContent).toContain("Jun")
  })

  test("lands inside the bounds when the year is only partly reachable", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={JUNE}
        maxValue={new CalendarDate(2027, 2, 10)}
      />,
    )

    await user.click(dropdown("Year"))
    await user.click(screen.getByRole("option", { name: "2027" }))

    // June 2027 is past `maxValue`, so focus lands on February — the month the
    // bound allows — rather than snapping back and leaving 2027 showing a year
    // the calendar is not on.
    expect(visibleRange()).toContain("2027")
    expect(dropdown("Month").textContent).toContain("Feb")
    expect(dropdown("Year").textContent).toContain("2027")
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

    expect(await openAndRead(user, "Year")).toEqual(["2026", "2027"])
  })
})

describe("month dropdown", () => {
  test("offers only the months the bounds can reach", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        minValue={JUNE}
        maxValue={new CalendarDate(2026, 8, 20)}
      />,
    )

    expect(await openAndRead(user, "Month")).toEqual(["Jun", "Jul", "Aug"])
  })

  test("still offers all twelve when nothing bounds them", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(await openAndRead(user, "Month")).toHaveLength(12)
  })

  test("picks by key, not by position in the filtered list", async () => {
    const user = userEvent.setup()
    render(
      <Calendar aria-label="Booking date" defaultValue={JUNE} minValue={JUNE} />,
    )

    // July is the second row but the seventh month; an index lookup would have
    // focused February.
    await user.click(dropdown("Month"))
    await user.click(screen.getByRole("option", { name: "Jul" }))

    expect(visibleRange()).toContain("July")
    expect(dropdown("Month").textContent).toContain("Jul")
  })
})
