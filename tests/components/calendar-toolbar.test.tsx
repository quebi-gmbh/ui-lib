/**
 * The Calendar Toolbar's layout, and the two controls the per-handler gating
 * does not simply switch on and off.
 *
 * The chevrons and the today button are gated on their handlers — leave one
 * out and its control is not drawn — and `calendar-views.test.tsx` covers what
 * the four views do with them. This file is about the three places that need
 * more than that:
 *
 * 1. **The view switcher cannot be gated on its handler** (task #169). It
 *    doubles as the read-only "which view am I in" indicator, so dropping it
 *    when there is no `onViewChange` would take that use away. But the group is
 *    fully controlled from `view`, so a press without a handler fires, changes
 *    nothing, and the next render re-asserts the same selection — a control
 *    that looks pressable and is not. `isDisabled` is the middle answer: the
 *    indicator survives and the press never invites itself.
 * 2. **The three date controls are one segmented group.** Back, `Today` and
 *    forward used to be three loose buttons drawn before the heading, so a
 *    reader met "Today 13.–19. Juli 2026" and `Today` read as a word in the
 *    date. They are joined now, in that order, after the heading — and the
 *    gating still holds inside the group: any subset is a group, none of them
 *    is no group rather than an empty box.
 * 3. **`labelVariant="picker"` makes the label a date picker** (task #166).
 *    The toolbar owns no state, so the popover reports the day it was given
 *    and closes; what the view does with it is the view's business. The grid it
 *    opens is the unit the heading is spelled in — a day, a week or a month —
 *    and a week grid has two inputs the others do not: the locale and the first
 *    day of the week decide which seven days a row *is*, so the grid has to
 *    agree with the view about both.
 *
 * Dates are pinned rather than read from the clock, so a run in December does
 * not read differently from a run in June.
 */
import { CalendarDate } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { useState } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CalendarToolbar } from "../../src/components/calendar-toolbar"

const switcher = () => screen.getByRole("radiogroup", { name: "Calendar view" })
const option = (name: string) => screen.getByRole("radio", { name })

describe("the view switcher without a handler", () => {
  test("is still drawn, so it can say which view you are in", () => {
    render(<CalendarToolbar label="A week" view="week" views={["week", "month"]} />)

    expect(switcher()).toBeInTheDocument()
    expect(option("Week")).toHaveAttribute("aria-checked", "true")
  })

  test("is disabled rather than silently inert", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar label="A week" view="week" views={["week", "month"]} />)

    expect(option("Month")).toBeDisabled()

    await user.click(option("Month"))

    // The selection is pinned by `view` either way; the point is that the
    // control said so before the press.
    expect(option("Week")).toHaveAttribute("aria-checked", "true")
  })

  test("is live again the moment a handler is wired", async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    render(
      <CalendarToolbar
        label="A week"
        view="week"
        views={["week", "month"]}
        onViewChange={(next) => seen.push(next)}
      />,
    )

    expect(option("Month")).not.toBeDisabled()

    await user.click(option("Month"))

    expect(seen).toEqual(["month"])
  })
})

/** Sunday, 20 September 2026 — pinned, so a run in December reads the same. */
const SEPTEMBER = new CalendarDate(2026, 9, 20)

/** Mid-week, so a week choice has a weekday it could lose. */
const WEDNESDAY = new CalendarDate(2026, 9, 23)

/**
 * The trigger has no `aria-label`: it would replace the button's own text as
 * the accessible name, and the formatted date is the more useful of the two.
 * `data-slot` is the stable handle, as it is for `Calendar`'s own header.
 */
const trigger = () => document.querySelector('[data-slot="calendar-toolbar-label"]') as HTMLElement

const navigation = () => screen.queryByRole("group", { name: "Calendar navigation" })

describe("the date controls", () => {
  test("are one group, after the heading, reading back / today / forward", () => {
    render(
      <CalendarToolbar
        label="13.–19. Juli 2026"
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    const group = navigation()
    expect(group).not.toBeNull()
    expect(
      within(group as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label") ?? button.textContent),
    ).toEqual(["Previous", "Today", "Next"])

    // The heading is what the view is *about*, so it comes first. Before this
    // it came last, and the toolbar read "Today 13.–19. Juli 2026".
    const label = trigger()
    expect(label.compareDocumentPosition(group as HTMLElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  test("are still gated one by one inside the group", () => {
    render(<CalendarToolbar label="13.–19. Juli 2026" onPrevious={() => {}} onNext={() => {}} />)

    expect(screen.queryByRole("button", { name: "Today" })).toBeNull()
    expect(within(navigation() as HTMLElement).getAllByRole("button")).toHaveLength(2)
  })

  test("leave no empty box behind when none of them is wired", () => {
    render(<CalendarToolbar label="13.–19. Juli 2026" />)

    expect(navigation()).toBeNull()
  })

  test("are all pressable, and report nothing else", async () => {
    const user = userEvent.setup()
    const pressed: string[] = []
    render(
      <CalendarToolbar
        label="13.–19. Juli 2026"
        onPrevious={() => pressed.push("previous")}
        onNext={() => pressed.push("next")}
        onToday={() => pressed.push("today")}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Previous" }))
    await user.click(screen.getByRole("button", { name: "Today" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(pressed).toEqual(["previous", "today", "next"])
  })

  test("are disabled together with the rest of the toolbar", () => {
    render(
      <CalendarToolbar
        label="13.–19. Juli 2026"
        isDisabled
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    for (const name of ["Previous", "Today", "Next"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled()
    }
  })
})

describe("the picker variant", () => {
  test("reports the day that was picked, and closes behind it", async () => {
    const user = userEvent.setup()
    const seen: CalendarDate[] = []
    render(
      <CalendarToolbar
        label="Sunday, 20 September 2026"
        labelVariant="picker"
        date={SEPTEMBER}
        onDateChange={(next) => seen.push(next)}
      />,
    )

    expect(screen.queryByRole("application")).toBeNull()

    await user.click(trigger())
    await user.click(screen.getByRole("button", { name: "Tuesday, September 8, 2026" }))

    expect(seen.map(String)).toEqual(["2026-09-08"])
  })

  test("opens a month grid instead when the heading names a month", async () => {
    const user = userEvent.setup()
    const seen: CalendarDate[] = []
    render(
      <CalendarToolbar
        label="September 2026"
        labelVariant="picker"
        pickerGranularity="month"
        date={SEPTEMBER}
        onDateChange={(next) => seen.push(next)}
      />,
    )

    await user.click(trigger())

    // Twelve cells, not a day grid asking for something the heading never says.
    expect(screen.getAllByRole("option")).toHaveLength(12)

    await user.click(screen.getByRole("option", { name: "December 2026" }))

    // The anchor day survives: MonthPicker reports the 1st because a month is
    // all it was asked for, but the view was anchored on the 20th.
    expect(seen.map(String)).toEqual(["2026-12-20"])
  })

  test("offers weeks, not days, when the heading names a week", async () => {
    const user = userEvent.setup()
    const seen: CalendarDate[] = []
    render(
      <CalendarToolbar
        label="20.–26. September 2026"
        labelVariant="picker"
        pickerGranularity="week"
        date={WEDNESDAY}
        onDateChange={(next) => seen.push(next)}
      />,
    )

    await user.click(trigger())

    // One option per week of the month on show, not thirty-something days: the
    // reader is choosing between weeks, and every day of a row leads to the
    // same view.
    const weeks = screen.getAllByRole("option")
    expect(weeks).toHaveLength(5)
    expect(weeks.every((row) => row.getAttribute("aria-label")?.startsWith("Week "))).toBe(true)

    await user.click(weeks[1] as HTMLElement)

    // The anchor was a Wednesday, so the Wednesday of the chosen week is what
    // comes back — the promise the month grid makes about the day of the month.
    expect(seen.map(String)).toEqual(["2026-09-09"])
  })

  test("lays the week grid out in the locale it is given, not the ambient one", async () => {
    const user = userEvent.setup()
    const selected = async (props: Partial<React.ComponentProps<typeof CalendarToolbar>>) => {
      const { unmount } = render(
        <CalendarToolbar
          label="A week"
          labelVariant="picker"
          pickerGranularity="week"
          date={WEDNESDAY}
          onDateChange={() => {}}
          {...props}
        />,
      )
      await user.click(trigger())
      const name = screen
        .getAllByRole("option")
        .find((row) => row.getAttribute("aria-selected") === "true")
        ?.getAttribute("aria-label")
      unmount()
      return name ?? ""
    }

    // The test environment is en-US, where the week of the 23rd runs from the
    // 20th to the 26th; under de-DE the same day sits in the 21st to the 27th.
    // The 21st is what the assertions turn on — a bare "20" would also match
    // the year in every one of these labels.
    expect(await selected({})).not.toContain("21")
    expect(await selected({ locale: "de-DE" })).toContain("21")

    // `firstDayOfWeek` overrides the locale's answer in the grid exactly as it
    // does in the view, so a view that starts its weeks on Sunday cannot be
    // handed a Monday-first grid to choose from.
    expect(await selected({ locale: "de-DE", firstDayOfWeek: "sun" })).not.toContain("21")
  })

  test("wraps a custom label rather than ignoring it", async () => {
    const user = userEvent.setup()
    render(
      <CalendarToolbar
        label={<span>Week 39</span>}
        labelVariant="picker"
        date={SEPTEMBER}
        onDateChange={() => {}}
      />,
    )

    // `label` says what you are looking at, `date` says where the picker opens.
    // The two are independent, so the variant wraps whatever it is handed.
    expect(trigger().textContent).toContain("Week 39")
    await user.click(trigger())
    expect(screen.getByRole("button", { name: "Tuesday, September 8, 2026" })).toBeInTheDocument()
  })

  test("falls back to the static label with nothing to report to", () => {
    render(<CalendarToolbar label="Sunday, 20 September 2026" labelVariant="picker" />)

    // No `date` and no `onDateChange` means there is nothing to open the grid
    // on and nowhere to send a choice. The span carries the same text, so
    // unlike the old view switcher nothing pressable is left behind.
    expect(trigger().tagName).toBe("SPAN")
  })
})

/**
 * One bar, and the two ways out of it.
 *
 * A picker heading is a button, so it is the first segment of the navigation
 * group rather than a separate item in front of it — that is what "one button
 * bar" means here, and it is why the heading's vertical padding is tightened:
 * `sm` around `text-base` is a rung taller than the `sq-sm` squares it now
 * shares a box with.
 *
 * `navigationPlacement` and `todayPlacement` then move their control out of
 * that bar and into the grid the heading opens. They are separate props because
 * the two are separate decisions — arrows in the bar and `Today` behind the
 * date is a real toolbar — and both fall back to the bar when there is no
 * picker to open, which is the same fallback `labelVariant` makes and for the
 * same reason: a control that moved somewhere that does not exist would not be
 * drawn at all.
 */
const bars = () => screen.getAllByRole("group", { name: "Calendar navigation" })

/** The one holding the heading — the popover's footer carries the same name. */
const bar = () => bars().find((group) => group.contains(trigger())) as HTMLElement

const names = (scope: HTMLElement) =>
  within(scope)
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label") ?? button.textContent)

describe("the bar", () => {
  test("is one group: the heading, then back / today / forward", () => {
    render(
      <CalendarToolbar
        label="Sunday, 20 September 2026"
        labelVariant="picker"
        date={SEPTEMBER}
        onDateChange={() => {}}
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    // The heading used to sit outside the group, separated by the same gap that
    // separates the date from the view switcher — so the toolbar had two
    // divisions and only one of them meant anything.
    expect(names(bar())).toEqual(["Sunday, 20 September 2026", "Previous", "Today", "Next"])
  })

  test("is not drawn around a heading with nothing to join it to", () => {
    render(
      <CalendarToolbar
        label="Sunday, 20 September 2026"
        labelVariant="picker"
        date={SEPTEMBER}
        onDateChange={() => {}}
      />,
    )

    // A lone button in a group named for navigation it does not contain says
    // something untrue, and `ButtonGroup` draws no box of its own to lose.
    expect(screen.queryByRole("group", { name: "Calendar navigation" })).toBeNull()
  })

  test("stays a box of its own behind a static heading, which cannot join it", () => {
    render(
      <CalendarToolbar label="13.–19. Juli 2026" onPrevious={() => {}} onToday={() => {}} />,
    )

    expect(trigger().tagName).toBe("SPAN")
    expect(bars()).toHaveLength(1)
    expect(names(bars()[0] as HTMLElement)).toEqual(["Previous", "Today"])
  })
})

describe("a control placed in the popover", () => {
  test("leaves the bar and turns up under the grid", async () => {
    const user = userEvent.setup()
    render(
      <CalendarToolbar
        label="Sunday, 20 September 2026"
        labelVariant="picker"
        date={SEPTEMBER}
        onDateChange={() => {}}
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
        todayPlacement="popover"
      />,
    )

    expect(names(bar())).toEqual(["Sunday, 20 September 2026", "Previous", "Next"])

    await user.click(trigger())

    const footer = bars().find((group) => !group.contains(trigger())) as HTMLElement
    expect(names(footer)).toEqual(["Today"])
  })

  test("still reports, and `Today` closes the surface behind it", async () => {
    const user = userEvent.setup()
    const pressed: string[] = []
    render(
      <CalendarToolbar
        label="Sunday, 20 September 2026"
        labelVariant="picker"
        date={SEPTEMBER}
        onDateChange={() => {}}
        onToday={() => pressed.push("today")}
        todayPlacement="popover"
      />,
    )

    await user.click(trigger())
    await user.click(screen.getByRole("button", { name: "Today" }))

    expect(pressed).toEqual(["today"])
    // A jump is a destination: the grid gets out of the way exactly as it does
    // when a day is picked, rather than sitting over the view the press moved.
    expect(screen.queryByRole("application")).toBeNull()
  })

  test("leaves the surface open when it is a chevron, and the grid follows", async () => {
    const user = userEvent.setup()
    const Controlled = () => {
      const [date, setDate] = useState(SEPTEMBER)
      return (
        <CalendarToolbar
          label="A day"
          labelVariant="picker"
          date={date}
          onDateChange={setDate}
          onPrevious={() => setDate(date.subtract({ days: 1 }))}
          onNext={() => setDate(date.add({ days: 1 }))}
          navigationPlacement="popover"
        />
      )
    }
    render(<Controlled />)

    // Nothing but the heading is left in the toolbar, so there is no bar.
    expect(screen.queryByRole("group", { name: "Calendar navigation" })).toBeNull()

    await user.click(trigger())

    // `Previous day`, not `Previous`: the grid under it pages its own month
    // with a chevron pair, and the two would otherwise be one name apiece.
    await user.click(screen.getByRole("button", { name: "Previous day" }))

    // A step, not a destination: the grid is the feedback, so it stays open and
    // the selection walks back a day with the press.
    expect(screen.queryByRole("application")).not.toBeNull()
    expect(
      screen.getByRole("button", { name: "Saturday, September 19, 2026 selected" }),
    ).toBeInTheDocument()
  })

  test("names the unit it steps, so the grid's own pair is a different button", async () => {
    const user = userEvent.setup()
    const openWith = async (props: Partial<React.ComponentProps<typeof CalendarToolbar>>) => {
      const { unmount } = render(
        <CalendarToolbar
          label="A range"
          labelVariant="picker"
          date={WEDNESDAY}
          onDateChange={() => {}}
          onPrevious={() => {}}
          navigationPlacement="popover"
          {...props}
        />,
      )
      await user.click(trigger())
      const named = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))
      unmount()
      return named
    }

    // The grid pages itself with a bare `Previous`; the footer steps the view.
    expect(await openWith({ pickerGranularity: "week" })).toContain("Previous week")
    expect(await openWith({ pickerGranularity: "month" })).toContain("Previous month")
    expect(await openWith({})).toContain("Previous day")

    // One prop still names it in both places — which is what a translation
    // needs, and what makes the two defaults a default rather than a rule.
    const translated = await openWith({ previousLabel: "Zurück" })
    expect(translated).toContain("Zurück")
    expect(translated).not.toContain("Previous day")
  })

  test("goes back to the bar when there is no popover to go to", () => {
    render(
      <CalendarToolbar
        label="13.–19. Juli 2026"
        onPrevious={() => {}}
        onToday={() => {}}
        navigationPlacement="popover"
        todayPlacement="popover"
      />,
    )

    // A static heading opens nothing, so both placements fall back rather than
    // dropping the controls — the fallback `labelVariant` already makes.
    expect(names(bars()[0] as HTMLElement)).toEqual(["Previous", "Today"])
  })
})

describe("the today button as an icon", () => {
  test("keeps the word as its accessible name", () => {
    render(
      <CalendarToolbar label="13.–19. Juli 2026" onToday={() => {}} todayVariant="icon" />,
    )

    const button = screen.getByRole("button", { name: "Today" })
    expect(button.textContent).toBe("")
    expect(button.querySelector("svg")).not.toBeNull()
  })

  test("is translated by the same prop the word is", () => {
    render(
      <CalendarToolbar
        label="13.–19. Juli 2026"
        onToday={() => {}}
        todayVariant="icon"
        todayLabel="Heute"
      />,
    )

    expect(screen.getByRole("button", { name: "Heute" })).toBeInTheDocument()
  })
})
