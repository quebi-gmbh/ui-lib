/**
 * What the Calendar Toolbar grew in tasks #208–#215, and the three places where
 * "it renders" is not the property worth pinning.
 *
 * `calendar-toolbar.test.tsx` covers the layout and the per-handler gating. This
 * file is about the additions, and each of them was a bug of the same shape: a
 * decision the component looked like it had made and had not.
 *
 * 1. **A bound the grid enforced and the chevron did not.** `minValue` reached
 *    the picker and stopped there, so the `›` beside a grid that refused to
 *    select past a maximum walked straight past it, one press at a time.
 * 2. **A string that was not a prop.** Every word in the bar is translatable
 *    except the one nobody sees — the switcher's group name — which was
 *    hardcoded English.
 * 3. **A closed union.** Four views, and a calendar's fifth is whatever its
 *    product calls it.
 *
 * Dates are pinned rather than read from the clock, and that is also why
 * `isTodayDisabled` is a prop: a default derived from `today()` would be read at
 * prerender on the build machine and again in the browser, which is the class of
 * bug this library formats every number to avoid.
 */
import { CalendarDate } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "../../src/components/button"
import { CalendarLegend } from "../../src/components/calendar-shell"
import { calendarRangeLabel, CalendarToolbar } from "../../src/components/calendar-toolbar"
import { MenuItem } from "../../src/components/menu"

/** Wednesday, 23 September 2026. */
const WEDNESDAY = new CalendarDate(2026, 9, 23)

const trigger = () => document.querySelector('[data-slot="calendar-toolbar-label"]') as HTMLElement
const button = (name: string) => screen.getByRole("button", { name })

describe("the bounds reach the chevrons, not only the grid", () => {
  test("the forward chevron is disabled when the step would leave the window", () => {
    render(
      <CalendarToolbar
        label="23. September 2026"
        date={WEDNESDAY}
        maxValue={WEDNESDAY}
        onPrevious={() => {}}
        onNext={() => {}}
      />,
    )

    expect(button("Next")).toBeDisabled()
    expect(button("Previous")).not.toBeDisabled()
  })

  test("the step is the unit the heading is spelled in", () => {
    // One day forward is inside the window; one *week* forward is not. With a
    // week heading the chevron steps weeks, so it is the week that decides.
    render(
      <CalendarToolbar
        label="21.–27. September 2026"
        pickerGranularity="week"
        date={WEDNESDAY}
        maxValue={WEDNESDAY.add({ days: 3 })}
        onPrevious={() => {}}
        onNext={() => {}}
      />,
    )

    expect(button("Next")).toBeDisabled()
  })

  test("a caller who steps by something else says so", () => {
    render(
      <CalendarToolbar
        label="23.–26. September 2026"
        date={WEDNESDAY}
        isPreviousDisabled
        isNextDisabled={false}
        maxValue={WEDNESDAY}
        onPrevious={() => {}}
        onNext={() => {}}
      />,
    )

    // Both props win over the derivation, in both directions: a four-day view
    // knows its own step and the toolbar does not.
    expect(button("Previous")).toBeDisabled()
    expect(button("Next")).not.toBeDisabled()
  })

  test("with no date there is nothing to derive from, and nothing is disabled", () => {
    render(
      <CalendarToolbar
        label="A week"
        maxValue={WEDNESDAY}
        onPrevious={() => {}}
        onNext={() => {}}
      />,
    )

    expect(button("Next")).not.toBeDisabled()
  })
})

describe("today, and the query a chevron press really is", () => {
  test("`isTodayDisabled` greys the jump out without touching the chevrons", () => {
    render(
      <CalendarToolbar
        label="23. September 2026"
        isTodayDisabled
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    expect(button("Today")).toBeDisabled()
    expect(button("Next")).not.toBeDisabled()
  })

  test("`isPending` stops a second press and says so on the root", () => {
    render(
      <CalendarToolbar
        label="23. September 2026"
        isPending
        view="week"
        views={["week", "month"]}
        onViewChange={() => {}}
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    for (const name of ["Previous", "Today", "Next"]) expect(button(name)).toBeDisabled()
    expect(document.querySelector('[data-slot="calendar-toolbar"]')).toHaveAttribute(
      "aria-busy",
      "true",
    )

    // Changing view is the page's business, not the query in flight.
    expect(screen.getByRole("radio", { name: "Month" })).not.toBeDisabled()
  })

  test("a pending picker cannot be asked for a second date", () => {
    render(
      <CalendarToolbar
        label="23. September 2026"
        labelVariant="picker"
        isPending
        date={WEDNESDAY}
        onDateChange={() => {}}
      />,
    )

    expect(trigger()).toBeDisabled()
  })
})

describe("the view switcher", () => {
  test("carries a name the caller can translate", () => {
    render(
      <CalendarToolbar
        label="A week"
        view="week"
        views={["week", "month"]}
        viewLabel="Ansicht"
        onViewChange={() => {}}
      />,
    )

    expect(screen.getByRole("radiogroup", { name: "Ansicht" })).toBeInTheDocument()
  })

  test("takes a view the library has never heard of, with its own word", async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    render(
      <CalendarToolbar
        label="A quarter"
        view="four-day"
        views={["week", { id: "four-day", label: "4 days" }]}
        onViewChange={(next) => seen.push(next)}
      />,
    )

    expect(screen.getByRole("radio", { name: "4 days" })).toHaveAttribute("aria-checked", "true")

    await user.click(screen.getByRole("radio", { name: "Week" }))

    // The identifier is what comes back, not the word it was drawn with.
    expect(seen).toEqual(["week"])
  })

  test("names the two views the library grew a word for", () => {
    render(
      <CalendarToolbar label="2026" view="year" views={["agenda", "year"]} onViewChange={() => {}} />,
    )

    expect(screen.getByRole("radio", { name: "Agenda" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Year" })).toBeInTheDocument()
  })

  test("is 38px overall, the height of the date controls beside it", () => {
    render(<CalendarToolbar label="A week" view="week" views={["week", "month"]} />)

    // `size="xs"` drew a 30px item in a 36px shell — the one control in the
    // library that matched nothing beside it (task #209). `height="control"`
    // is what puts the shell on the button scale instead.
    expect(screen.getByRole("radiogroup", { name: "Calendar view" }).className).toContain("h-9.5")
  })

  test("collapses to a menu, and both shapes report the same thing", async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    render(
      <CalendarToolbar
        label="A week"
        view="week"
        views={["week", "month"]}
        viewVariant="menu"
        onViewChange={(next) => seen.push(next)}
      />,
    )

    // Only one control, and it says which view you are in without being asked.
    expect(screen.queryByRole("radiogroup")).toBeNull()
    await user.click(button("Calendar view: Week"))
    await user.click(screen.getByRole("menuitemradio", { name: "Month" }))

    expect(seen).toEqual(["month"])
  })

  test("renders both shapes by default, because the breakpoint is CSS", () => {
    render(
      <CalendarToolbar label="A week" view="week" views={["week", "month"]} onViewChange={() => {}} />,
    )

    // A media query read during render would disagree with the prerendered
    // HTML, so the choice is made by the stylesheet and both are in the tree.
    expect(screen.getByRole("radiogroup", { name: "Calendar view" }).className).toContain(
      "sm:inline-flex",
    )
    expect(button("Calendar view: Week").className).toContain("sm:hidden")
  })
})

describe("the slots", () => {
  test("put each thing on its own side of the bar", () => {
    render(
      <CalendarToolbar
        label="A week"
        view="week"
        views={["week", "month"]}
        onViewChange={() => {}}
        startContent={<Button size="sm">Sidebar</Button>}
        action={<Button size="sm">New event</Button>}
      />,
    )

    const root = document.querySelector('[data-slot="calendar-toolbar"]') as HTMLElement
    const order = within(root)
      .getAllByRole("button")
      .map((element) => element.textContent)

    // The sidebar toggle is before the date; the action is after everything.
    expect(order[0]).toBe("Sidebar")
    expect(order.at(-1)).toBe("New event")
  })

  test("draw the `⋯` themselves, so its placement is not five different answers", async () => {
    const user = userEvent.setup()
    render(
      <CalendarToolbar
        label="A week"
        menuLabel="Weitere Optionen"
        menu={<MenuItem id="print">Print</MenuItem>}
      />,
    )

    await user.click(button("Weitere Optionen"))

    expect(screen.getByRole("menuitem", { name: "Print" })).toBeInTheDocument()
  })
})

describe("the chevrons side by side", () => {
  test("`paired` moves forward next to back, leaving the heading after them", () => {
    render(
      <CalendarToolbar
        label="23. September 2026"
        labelVariant="picker"
        navigationLayout="paired"
        date={WEDNESDAY}
        onDateChange={() => {}}
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    const group = screen.getByRole("group", { name: "Calendar navigation" })
    expect(
      within(group)
        .getAllByRole("button")
        .map((element) => element.getAttribute("aria-label") ?? element.textContent),
    ).toEqual(["Previous", "Next", "23. September 2026", "Today"])
  })

  test("says nothing when there is no heading between them to pull apart", () => {
    render(
      <CalendarToolbar
        label="23. September 2026"
        navigationLayout="paired"
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    // Already adjacent around `Today`, which is the symmetric unit either
    // layout draws when there is nothing in the middle.
    const group = screen.getByRole("group", { name: "Calendar navigation" })
    expect(
      within(group)
        .getAllByRole("button")
        .map((element) => element.getAttribute("aria-label") ?? element.textContent),
    ).toEqual(["Previous", "Today", "Next"])
  })
})

describe("a year heading", () => {
  test("opens the year grid the library already ships", async () => {
    const user = userEvent.setup()
    const seen: CalendarDate[] = []
    render(
      <CalendarToolbar
        label="2026"
        labelVariant="picker"
        pickerGranularity="year"
        date={WEDNESDAY}
        onDateChange={(next) => seen.push(next)}
      />,
    )

    await user.click(trigger())
    await user.click(screen.getByRole("option", { name: "2028" }))

    // `YearPicker` reports January 1; the anchor keeps its month and day, the
    // same promise the month grid makes about the day of the month.
    expect(seen.map(String)).toEqual(["2028-09-23"])
  })
})

describe("the heading a caller can shorten", () => {
  const days = Array.from({ length: 7 }, (_, index) => new CalendarDate(2026, 9, 21 + index))

  test("`length: \"short\"` is the numeric form the same locale writes", () => {
    expect(calendarRangeLabel([WEDNESDAY], { locale: "de-DE", length: "short" })).toBe("23.09.2026")

    // The long form is still the default, weekday and all.
    expect(calendarRangeLabel([WEDNESDAY], { locale: "de-DE" })).toContain("September")
  })

  test("`weekNumber` puts the ISO number in front, in the caller's word", () => {
    // 21–27 September 2026 is ISO week 39.
    expect(calendarRangeLabel(days, { locale: "de-DE", weekNumber: "KW" })).toStartWith("KW 39 · ")
    expect(calendarRangeLabel(days, { locale: "de-DE", weekNumber: true })).toStartWith("39 · ")
    expect(calendarRangeLabel(days, { locale: "de-DE" })).not.toContain("39")
  })
})

describe("the legend that looks like a filter", () => {
  const calendars = [
    { id: "me", name: "My calendar", color: "blue" as const },
    { id: "team", name: "Team", color: "orange" as const },
  ]

  test("is a read-only key until it is given a handler", () => {
    render(<CalendarLegend calendars={calendars} />)

    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(screen.getByText("Team")).toBeInTheDocument()
  })

  test("becomes the set of checkboxes it always looked like", async () => {
    const user = userEvent.setup()
    const seen: string[][] = []
    render(
      <CalendarLegend
        calendars={calendars}
        aria-label="Calendars"
        value={["me", "team"]}
        onChange={(next) => seen.push(next)}
      />,
    )

    await user.click(screen.getByRole("checkbox", { name: "Team" }))

    expect(seen).toEqual([["me"]])
  })
})
