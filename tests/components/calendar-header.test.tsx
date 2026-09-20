/**
 * The Calendar's two headers.
 *
 * `variant="select"` is the default: one control naming the visible month and
 * year, swapping the library's own Month Picker into the calendar body in place
 * of the day grid (task #160 made it a Month Picker where it had been a pair of
 * dropdowns; task #170 took it out of the popover of its own that #160 gave it),
 * and a single prev/next pair on the right that is react-aria's own
 * (`slot="previous"` / `slot="next"`, disabled for free from
 * `isPreviousVisibleRangeInvalid`). `variant="stepper"` replaces both halves
 * with `‹ Sep ›` and `‹ 2026 ›` and drops the paging pair, or the month would
 * carry two sets of chevrons meaning slightly different things. Task #120.
 *
 * What the picker itself offers is `calendar.test.tsx`; this file is about
 * which header you get and what it is made of.
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
 * The picker trigger's accessible name is the month and year it is showing, so
 * there is nothing constant to query it by. `data-slot` is the stable handle.
 */
const monthYearTrigger = () => document.querySelector('[data-slot="calendar-month-year"]')

describe("select header (default)", () => {
  test("renders the month/year picker trigger and the paging pair", () => {
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(monthYearTrigger()).toBeInTheDocument()
    expect(monthYearTrigger()?.textContent).toContain("June")
    expect(container.querySelector('[slot="previous"]')).toBeInTheDocument()
    expect(container.querySelector('[slot="next"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="calendar-header"]')).toHaveAttribute(
      "data-variant",
      "select",
    )
  })

  test("swaps in the Month Picker grid rather than a list of months", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(screen.queryByRole("option")).toBeNull()

    // The trigger's accessible name is its own text — the month and year it
    // will open on — which is more use to a screen reader than a constant.
    await user.click(screen.getByRole("button", { name: "June 2026" }))

    // Twelve cells and a year pager, not two flat lists.
    expect(screen.getAllByRole("option")).toHaveLength(12)
    expect(screen.getByRole("button", { name: "Next year" })).toBeInTheDocument()
  })

  test("is what a Calendar with no variant gets", () => {
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(screen.queryByRole("button", { name: "Previous month" })).not.toBeInTheDocument()
    expect(container.querySelectorAll("[data-variant]")).toHaveLength(1)
  })
})

/**
 * The swap itself (task #170).
 *
 * #160 put the Month Picker in a popover of its own, which inside a Date Picker
 * made two react-aria overlays out of one trigger chain: portalled to `body` as
 * siblings rather than nested, the inner one covering every cell of the day grid
 * and hanging past the bottom edge of the surface it was anchored in — over the
 * backdrop, on the mobile path, where that surface is a modal. The body swaps in
 * place instead, so what is worth pinning is that there is no second surface:
 * the month grid is a descendant of the calendar's own body, and the day grid it
 * replaced is gone rather than hidden behind it.
 *
 * The rest is what the swap has to not cost. Escape used to dismiss the inner
 * popover and leave the outer one open, and a press that only ever reached the
 * Date Picker's popover would close the whole picker from under the user — so
 * the body claims the key while the month grid holds it. And focus has to come
 * back to something: the month grid unmounts under whatever inside it had focus,
 * and `<body>` is not an answer.
 */
describe("the month grid swaps into the body", () => {
  const dayGrid = (container: HTMLElement) => container.querySelector("table")
  const monthGrid = (container: HTMLElement) =>
    container.querySelector('[data-slot="month-picker"]')
  const press = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(monthYearTrigger() as HTMLElement)
  }

  test("replaces the day grid instead of floating a surface over it", async () => {
    const user = userEvent.setup()
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(dayGrid(container)).toBeInTheDocument()

    await press(user)

    // Gone, not occluded — the day grid is what the month grid is standing in for.
    expect(dayGrid(container)).toBeNull()
    // Found through `container` at all is the assertion: a popover portals to
    // `document.body` and would not be in the calendar's own tree.
    const body = container.querySelector('[data-slot="calendar-body"]')
    expect(body?.contains(monthGrid(container))).toBe(true)
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0)
  })

  test("is a toggle, and says so", async () => {
    const user = userEvent.setup()
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    const bodyId = container.querySelector('[data-slot="calendar-body"]')?.id
    expect(bodyId).toBeTruthy()
    // `aria-pressed`, not `aria-expanded`: nothing expands. The body is the same
    // size in the same place, and what changes is which grid it draws.
    expect(monthYearTrigger()).toHaveAttribute("aria-pressed", "false")
    expect(monthYearTrigger()).toHaveAttribute("aria-controls", bodyId as string)

    await press(user)
    expect(monthYearTrigger()).toHaveAttribute("aria-pressed", "true")

    await press(user)
    expect(monthYearTrigger()).toHaveAttribute("aria-pressed", "false")
    expect(dayGrid(container)).toBeInTheDocument()
  })

  test("drops the paging pair while the month grid is showing", async () => {
    const user = userEvent.setup()
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    expect(container.querySelector('[slot="previous"]')).toBeInTheDocument()

    await press(user)

    // The pair walks the visible *month*, and the month grid has a year stepper
    // of its own a row below. Two chevron pairs stepping different units in one
    // surface is what `variant="stepper"` drops the pair to avoid.
    expect(container.querySelector('[slot="previous"]')).toBeNull()
    expect(container.querySelector('[slot="next"]')).toBeNull()
    expect(screen.getByRole("button", { name: "Next year" })).toBeInTheDocument()

    await press(user)
    expect(container.querySelector('[slot="previous"]')).toBeInTheDocument()
  })

  test("spends Escape on the month grid, not on whatever is above the calendar", async () => {
    const user = userEvent.setup()
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await press(user)
    await user.keyboard("{Escape}")

    expect(dayGrid(container)).toBeInTheDocument()
    expect(monthGrid(container)).toBeNull()
    expect(monthYearTrigger()).toHaveAttribute("aria-pressed", "false")
  })

  test("puts focus back on the trigger when the month grid goes away", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await press(user)
    await user.click(screen.getByRole("option", { name: "October 2026" }))

    // The grid unmounts under whatever inside it had focus. Left alone, focus
    // falls to `<body>` and the next Escape belongs to the document rather than
    // to the popover a Date Picker put the calendar in.
    expect(document.activeElement).toBe(monthYearTrigger())
  })

  test("hands the month grid working arrow keys", async () => {
    const user = userEvent.setup()
    const { container } = render(<Calendar aria-label="Event date" defaultValue={JUNE} />)

    await press(user)
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "June 2026" }))

    // The day grid this replaced is fully keyboard-navigable, so a month grid
    // that is not would be an accessibility regression against the surface it
    // stands in for. `date-part-pickers.test.tsx` has the delegate argument.
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "July 2026" }))

    await user.keyboard("{Enter}")

    expect(dayGrid(container)).toBeInTheDocument()
    expect(visibleRange()).toContain("July")
  })

  test("reaches the RangeCalendar through the shared body", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <RangeCalendar
        aria-label="Trip dates"
        defaultValue={{ start: JUNE, end: JUNE.add({ days: 5 }) }}
        visibleDuration={{ months: 2 }}
      />,
    )

    expect(container.querySelectorAll("table")).toHaveLength(2)

    await press(user)

    // Both months go, not just the one the trigger names.
    expect(container.querySelectorAll("table")).toHaveLength(0)
    expect(monthGrid(container)).toBeInTheDocument()
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
    expect(monthYearTrigger()).not.toBeInTheDocument()
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
