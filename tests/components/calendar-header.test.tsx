/**
 * The Calendar's two headers.
 *
 * `variant="select"` is the one that has always been there: month and year
 * dropdowns on the left, and a single prev/next pair on the right that is
 * react-aria's own (`slot="previous"` / `slot="next"`, disabled for free from
 * `isPreviousVisibleRangeInvalid`). `variant="stepper"` replaces both halves
 * with `‹ Sep ›` and `‹ 2026 ›` and drops the paging pair, or the month would
 * carry two sets of chevrons meaning slightly different things. Task #120.
 *
 * What is worth pinning is the part react-aria does not give away. A step is
 * `setFocusedDate`, and react-aria clamps every focus move to
 * `minValue`/`maxValue` — so a chevron past the bound is not an error, it is a
 * no-op, and a control that looks live and does nothing is the failure mode
 * this component has to avoid. `CalendarStepper` therefore asks what the move
 * would land on before offering it, and the bound tests below are that
 * question: at `minValue` the two "previous" chevrons must be disabled and the
 * two "next" ones must not.
 *
 * Dates are pinned to a fixed month rather than `today()`, so a run in
 * December does not read differently from a run in June.
 */
import { CalendarDate } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Calendar } from "../../src/components/calendar"
import { RangeCalendar } from "../../src/components/range-calendar"

const JUNE = new CalendarDate(2026, 6, 15)

/** The sr-only `<Heading>` react-aria fills with the visible range. */
const visibleRange = () => document.querySelector("h2")?.textContent ?? ""

const chevron = (label: string) => screen.getByRole("button", { name: label })

/**
 * The Select triggers carry `aria-label` but are also `aria-labelledby` their
 * own value, so their accessible name is "Jun Month" and a role query by name
 * does not find them. The attribute is the stable thing to ask for.
 */
const dropdown = (label: string) => document.querySelector(`button[aria-label="${label}"]`)

describe("select header (default)", () => {
  test("renders the month and year dropdowns and the paging pair", () => {
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(dropdown("Month")).toBeInTheDocument()
    expect(dropdown("Year")).toBeInTheDocument()
    expect(container.querySelector('[slot="previous"]')).toBeInTheDocument()
    expect(container.querySelector('[slot="next"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="calendar-header"]')).toHaveAttribute(
      "data-variant",
      "select",
    )
  })

  test("is what a Calendar with no variant gets", () => {
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(screen.queryByRole("button", { name: "Previous month" })).not.toBeInTheDocument()
    expect(container.querySelectorAll("[data-variant]")).toHaveLength(1)
  })
})

describe("stepper header", () => {
  test("replaces the dropdowns and the paging pair with a chevron on each side", () => {
    const { container } = render(
      <Calendar aria-label="Event date" defaultValue={JUNE} variant="stepper" />,
    )

    for (const label of ["Previous month", "Next month", "Previous year", "Next year"]) {
      expect(chevron(label)).toBeInTheDocument()
    }
    expect(dropdown("Month")).not.toBeInTheDocument()
    expect(dropdown("Year")).not.toBeInTheDocument()
    expect(container.querySelector('[slot="previous"]')).not.toBeInTheDocument()
    expect(container.querySelector('[slot="next"]')).not.toBeInTheDocument()
  })

  test("keeps the sr-only heading that names the visible range", () => {
    render(<Calendar aria-label="Event date" defaultValue={JUNE} variant="stepper" />)

    expect(visibleRange()).toContain("2026")
  })

  test("steps the visible month and the visible year", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} variant="stepper" />)

    const june = visibleRange()

    await user.click(chevron("Next month"))
    const july = visibleRange()
    expect(july).not.toBe(june)

    await user.click(chevron("Previous month"))
    expect(visibleRange()).toBe(june)

    await user.click(chevron("Next year"))
    expect(visibleRange()).toContain("2027")

    await user.click(chevron("Previous year"))
    expect(visibleRange()).toBe(june)
  })

  test("disables the chevrons a step would only clamp back", () => {
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        variant="stepper"
        minValue={JUNE}
        maxValue={JUNE.add({ days: 10 })}
      />,
    )

    // Every reachable date is inside June 2026, so no step leaves the month —
    // note the bound is mid-month, so a naive "would focus move?" test would
    // have left "Next month" live.
    expect(chevron("Previous month")).toBeDisabled()
    expect(chevron("Next month")).toBeDisabled()
    expect(chevron("Previous year")).toBeDisabled()
    expect(chevron("Next year")).toBeDisabled()
  })

  test("leaves the direction that still moves enabled", () => {
    render(
      <Calendar
        aria-label="Booking date"
        defaultValue={JUNE}
        variant="stepper"
        minValue={JUNE}
      />,
    )

    expect(chevron("Previous month")).toBeDisabled()
    expect(chevron("Previous year")).toBeDisabled()
    expect(chevron("Next month")).not.toBeDisabled()
    expect(chevron("Next year")).not.toBeDisabled()
  })

  test("goes dead with the calendar", () => {
    render(
      <Calendar aria-label="Locked calendar" defaultValue={JUNE} variant="stepper" isDisabled />,
    )

    for (const label of ["Previous month", "Next month", "Previous year", "Next year"]) {
      expect(chevron(label)).toBeDisabled()
    }
  })

  test("reaches the RangeCalendar through the shared header", () => {
    const { container } = render(
      <RangeCalendar
        aria-label="Trip dates"
        defaultValue={{ start: JUNE, end: JUNE.add({ days: 5 }) }}
        variant="stepper"
      />,
    )

    expect(chevron("Previous month")).toBeInTheDocument()
    expect(chevron("Next year")).toBeInTheDocument()
    expect(container.querySelector('[slot="next"]')).not.toBeInTheDocument()
  })
})
