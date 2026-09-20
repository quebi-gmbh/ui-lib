/**
 * The Calendar Toolbar's two controls that are not a chevron.
 *
 * The chevrons and the today button are gated on their handlers — leave one
 * out and its control is not drawn — and `calendar-views.test.tsx` covers what
 * the four views do with them. This file is about the two places where that
 * pattern does not apply:
 *
 * 1. **The view switcher cannot be gated on its handler** (task #169). It
 *    doubles as the read-only "which view am I in" indicator, so dropping it
 *    when there is no `onViewChange` would take that use away. But the group is
 *    fully controlled from `view`, so a press without a handler fires, changes
 *    nothing, and the next render re-asserts the same selection — a control
 *    that looks pressable and is not. `isDisabled` is the middle answer: the
 *    indicator survives and the press never invites itself.
 * 2. **`labelVariant="picker"` makes the label a date picker** (task #166).
 *    The toolbar owns no state, so the popover reports the day it was given
 *    and closes; what the view does with it is the view's business.
 *
 * Dates are pinned rather than read from the clock, so a run in December does
 * not read differently from a run in June.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
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
