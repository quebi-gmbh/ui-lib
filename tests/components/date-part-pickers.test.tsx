/**
 * Year Picker, Month Picker and Week Picker — the three things they each own.
 *
 * All three are standalone state machines rather than chrome inside a react-aria
 * Calendar, so nothing upstream checks any of this for them:
 *
 * - **The page.** Which cells are on screen is local state paged by two buttons,
 *   and it has to follow a value that arrives from outside without yanking the
 *   user's own paging back.
 * - **The value.** A year cell means January 1, a month cell means the first —
 *   except where `minValue`/`maxValue` land mid-period, where handing back a
 *   date the caller's own bounds reject is a bug that only surfaces in their
 *   validation.
 * - **The week.** A week is atomic: a value snaps to the whole row on the way in
 *   and comes back whole on the way out, and the gutter number is ISO-8601,
 *   which is not the same question as where the locale starts its weeks.
 *
 * The locale is pinned for every render below. `useLocale()` otherwise answers
 * with the runtime default, and a Monday-first and a Sunday-first machine would
 * disagree about which seven days are a row.
 */
import { CalendarDate, HebrewCalendar, toCalendar } from "@internationalized/date"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nProvider } from "react-aria-components"
import { MonthPicker } from "../../src/components/month-picker"
import { WeekPicker, type WeekRange } from "../../src/components/week-picker"
import { YearPicker } from "../../src/components/year-picker"

const inLocale = (locale: string, ui: React.ReactElement) =>
  render(<I18nProvider locale={locale}>{ui}</I18nProvider>)

/** Every cell of the grid, in DOM order, by accessible name. */
const optionNames = () => screen.getAllByRole("option").map((o) => o.getAttribute("aria-label") ?? o.textContent)

const option = (name: string) => screen.getByRole("option", { name })

describe("YearPicker", () => {
  test("pages a decade at a time, with the boundary years on the page", async () => {
    inLocale("en-GB", <YearPicker aria-label="Year" defaultValue={new CalendarDate(2026, 3, 4)} />)

    // The decade 2020-2029, plus the year either side — so 2019 and 2030 are one
    // click away rather than one page away.
    expect(optionNames()).toEqual([
      "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030",
    ])

    await userEvent.click(screen.getByRole("button", { name: "Next decade" }))

    expect(optionNames()).toEqual([
      "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040",
    ])
  })

  test("emits January 1 of the year it was given", async () => {
    const received: CalendarDate[] = []
    inLocale("en-GB", <YearPicker aria-label="Year" onChange={(value) => received.push(value)} />)

    await userEvent.click(option("2024"))

    expect(received.at(-1)?.toString()).toBe("2024-01-01")
  })

  test("clamps into a minValue that lands mid-year", async () => {
    const received: CalendarDate[] = []
    inLocale(
      "en-GB",
      <YearPicker
        aria-label="Year"
        minValue={new CalendarDate(2026, 7, 15)}
        onChange={(value) => received.push(value)}
      />,
    )

    // 2026 is selectable — half of it is in range — but its January 1 is not.
    await userEvent.click(option("2026"))
    expect(received.at(-1)?.toString()).toBe("2026-07-15")

    // A year wholly inside the range is untouched.
    await userEvent.click(option("2027"))
    expect(received.at(-1)?.toString()).toBe("2027-01-01")
  })

  test("offers a year if any of its days is in range, and no others", () => {
    inLocale(
      "en-GB",
      <YearPicker
        aria-label="Year"
        defaultValue={new CalendarDate(2026, 1, 1)}
        minValue={new CalendarDate(2025, 12, 31)}
        maxValue={new CalendarDate(2027, 1, 1)}
      />,
    )

    const enabled = screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-disabled") !== "true")
      .map((o) => o.textContent)

    expect(enabled).toEqual(["2025", "2026", "2027"])
  })

  test("follows a value that changes from outside to its own decade", () => {
    const { rerender } = inLocale(
      "en-GB",
      <YearPicker aria-label="Year" value={new CalendarDate(2026, 1, 1)} />,
    )
    expect(optionNames()[0]).toBe("2019")

    rerender(
      <I18nProvider locale="en-GB">
        <YearPicker aria-label="Year" value={new CalendarDate(1998, 1, 1)} />
      </I18nProvider>,
    )

    expect(optionNames()[0]).toBe("1989")
    expect(option("1998")).toHaveAttribute("aria-selected", "true")
  })
})

/**
 * Arrow keys, for both grids (task #170).
 *
 * These grids spent their whole life with `orientation="horizontal"` on a
 * `layout="grid"` ListBox, which is the combination react-aria's
 * `ListKeyboardDelegate` handles worst: left/right went through
 * `findKey(..., isSameColumn)`, which compares every candidate against the rect
 * it *started* from rather than the previous one, so from the last column every
 * later cell was either in another row or in the same column, every candidate
 * was skipped and it returned null. ArrowRight did nothing at all. Up/down
 * meanwhile fell through to plain collection order, so ArrowDown moved one cell
 * rather than one row. The grid reads left-to-right, but as far as the delegate
 * is concerned that is a *vertical* orientation, and saying so fixes both.
 *
 * Only the horizontal arrows are pinned here. Up and down go through
 * `getItemRect`, and every rect is zero in happy-dom, so a row step is not
 * observable outside a real browser — but ArrowRight is the key that was a
 * no-op, and it is pure collection order once the orientation is right.
 */
describe("the picker grids take arrow keys", () => {
  /**
   * Focus is seeded with a click rather than `autoFocus`, deliberately. The
   * assertion is about what an arrow key does once focus is in the grid, and
   * leaving that to `autoFocus` makes each test depend on focus surviving the
   * one before it — which it does not, and which made a broken MonthPicker show
   * up as a failing YearPicker.
   */
  const seed = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
    await user.click(option(name))
    expect(document.activeElement).toBe(option(name))
  }

  test("MonthPicker walks months with the horizontal arrows", async () => {
    const user = userEvent.setup()
    inLocale(
      "en-GB",
      <MonthPicker aria-label="Month" defaultValue={new CalendarDate(2026, 6, 15)} />,
    )

    // September is the last cell of a row in a 3-column grid, which is the case
    // the old delegate returned null for even in a real browser.
    await seed(user, "September 2026")

    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(option("October 2026"))

    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(option("September 2026"))
  })

  test("MonthPicker selects the month the arrows landed on", async () => {
    const received: CalendarDate[] = []
    const user = userEvent.setup()
    inLocale(
      "en-GB",
      <MonthPicker
        aria-label="Month"
        defaultValue={new CalendarDate(2026, 6, 15)}
        onChange={(value) => received.push(value)}
      />,
    )

    await seed(user, "June 2026")
    await user.keyboard("{ArrowRight}")
    await user.keyboard("{Enter}")

    expect(received.at(-1)?.toString()).toBe("2026-07-01")
  })

  test("YearPicker walks years the same way", async () => {
    const user = userEvent.setup()
    inLocale("en-GB", <YearPicker aria-label="Year" defaultValue={new CalendarDate(2026, 3, 4)} />)

    await seed(user, "2026")

    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(option("2027"))

    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(option("2026"))
  })
})

describe("MonthPicker", () => {
  test("shows twelve months of one year and steps the year", async () => {
    inLocale(
      "en-GB",
      <MonthPicker aria-label="Month" defaultValue={new CalendarDate(2026, 5, 9)} />,
    )

    expect(optionNames()).toHaveLength(12)
    expect(optionNames()[0]).toBe("January 2026")
    expect(option("May 2026")).toHaveAttribute("aria-selected", "true")

    await userEvent.click(screen.getByRole("button", { name: "Previous year" }))

    expect(optionNames()[0]).toBe("January 2025")
    // Paging is not selecting: the value has not moved.
    expect(screen.queryByRole("option", { selected: true })).toBeNull()
  })

  test("counts in the calendar system it is handed", async () => {
    // Gregorian by default — a standalone picker has no state above it — but
    // `Calendar`'s header passes `state.focusedDate.calendar` down, and without
    // that a Hebrew year's thirteenth month would be missing from a header that
    // names it. 5784 is a leap year in the Hebrew calendar: thirteen months.
    inLocale(
      "he-IL-u-ca-hebrew",
      <MonthPicker
        aria-label="Month"
        calendar={new HebrewCalendar()}
        defaultValue={toCalendar(new CalendarDate(2024, 1, 15), new HebrewCalendar())}
      />,
    )

    expect(optionNames()).toHaveLength(13)
  })

  test("emits the first of the month, clamped into the bounds", async () => {
    const received: CalendarDate[] = []
    inLocale(
      "en-GB",
      <MonthPicker
        aria-label="Month"
        defaultValue={new CalendarDate(2026, 6, 1)}
        minValue={new CalendarDate(2026, 3, 15)}
        onChange={(value) => received.push(value)}
      />,
    )

    await userEvent.click(option("August 2026"))
    expect(received.at(-1)?.toString()).toBe("2026-08-01")

    // March is offered — the back half of it is in range — but the first is not.
    await userEvent.click(option("March 2026"))
    expect(received.at(-1)?.toString()).toBe("2026-03-15")

    // February is wholly before the bound.
    expect(option("February 2026")).toHaveAttribute("aria-disabled", "true")
  })
})

describe("WeekPicker", () => {
  const september2026 = { start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 1) }

  test("numbers the rows ISO-8601, whatever day the locale starts a week on", () => {
    inLocale("en-GB", <WeekPicker aria-label="Week" defaultValue={september2026} />)

    // Monday-first: 31 Aug - 4 Oct 2026 is ISO weeks 36 to 40.
    expect(optionNames().map((name) => name?.split(",")[0])).toEqual([
      "Week 36", "Week 37", "Week 38", "Week 39", "Week 40",
    ])
  })

  test("keeps the same ISO numbers in a Sunday-first locale", () => {
    inLocale("en-US", <WeekPicker aria-label="Week" defaultValue={september2026} />)

    // The rows shift a day earlier, but a row's ISO week is the one that owns
    // most of it — Sunday 13 Sep sits in the row of week 38, not week 37.
    const names = optionNames().map((name) => name?.split(",")[0])
    expect(names).toContain("Week 36")
    expect(names).toContain("Week 38")
    expect(names).toContain("Week 40")
  })

  test("numbers a row that straddles the year end from the ISO year it belongs to", () => {
    inLocale(
      "en-GB",
      <WeekPicker
        aria-label="Week"
        defaultValue={{ start: new CalendarDate(2027, 1, 1), end: new CalendarDate(2027, 1, 1) }}
      />,
    )

    // 28 Dec 2026 - 3 Jan 2027 is ISO week 53 of 2026; the row after it is week 1.
    const names = optionNames().map((name) => name?.split(",")[0])
    expect(names[0]).toBe("Week 53")
    expect(names[1]).toBe("Week 1")
  })

  test("snaps an incoming value to the whole row", () => {
    // A Wednesday, handed over as a zero-length range.
    inLocale(
      "en-GB",
      <WeekPicker
        aria-label="Week"
        defaultValue={{ start: new CalendarDate(2026, 9, 16), end: new CalendarDate(2026, 9, 16) }}
      />,
    )

    const selected = screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true")
    expect(selected?.getAttribute("aria-label")).toContain("Week 38")
  })

  test("emits a whole week, and does not truncate it at minValue", async () => {
    const received: WeekRange[] = []
    inLocale(
      "en-GB",
      <WeekPicker
        aria-label="Week"
        defaultValue={september2026}
        // A Wednesday, in the middle of ISO week 38.
        minValue={new CalendarDate(2026, 9, 16)}
        onChange={(value) => received.push(value)}
      />,
    )

    // Week 37 ends before the bound; week 38 contains it and stays selectable.
    expect(screen.getByRole("option", { name: /Week 37/ })).toHaveAttribute("aria-disabled", "true")

    await userEvent.click(screen.getByRole("option", { name: /Week 38/ }))

    // The whole week comes back, bound or no bound — a partial one would be a
    // Range Calendar, which is the component this one exists not to be.
    expect(received.at(-1)?.start.toString()).toBe("2026-09-14")
    expect(received.at(-1)?.end.toString()).toBe("2026-09-20")
  })

  test("drops the gutter on hideWeekNumbers without changing the weeks", () => {
    inLocale("en-GB", <WeekPicker aria-label="Week" defaultValue={september2026} hideWeekNumbers />)

    // The label still carries the number for screen readers; the column is gone.
    expect(optionNames()[0]).toContain("Week 36")
    expect(screen.queryByText("Wk")).toBeNull()
  })
})
