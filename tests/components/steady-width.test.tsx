/**
 * A control that changes width on the press moves out from under the pointer
 * that pressed it.
 *
 * The reported case is the calendar toolbar: its heading is the only segment in
 * the date bar whose width is a sentence, so stepping from `Donnerstag, 24.
 * September 2026` to `Freitag, 2. Oktober 2026` took ~40px out of the group and
 * slid `Today` and the forward chevron left — between the reader's first press
 * and their second. The same defect is anywhere a control's label is its width:
 * a `Copy` button that says `Copied` for two seconds, a view trigger that says
 * `Day` and then `Timeline`.
 *
 * `src/lib/steady-width.tsx` holds the width open two ways, and the split is
 * what this file is mostly about — when the component knows every string the
 * slot can hold, the reservation is static and correct in the prerendered HTML;
 * when it does not, it is a measured high-water mark. Only the second needs a
 * browser, so only the second is exercised through a stubbed `scrollWidth`:
 * happy-dom has no layout engine and reports 0 for every box, which is also why
 * the hook ignores a zero rather than reserving it.
 */
import { CalendarDate } from "@internationalized/date"
import { afterEach, describe, expect, test } from "bun:test"
import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "../../src/components/button"
import { CalendarToolbar } from "../../src/components/calendar-toolbar"
import { Snippet } from "../../src/components/snippet"
import { SteadyWidth, useSteadyWidth } from "../../src/lib/steady-width"

/**
 * happy-dom reports `scrollWidth: 0` for everything, so a hook whose whole job
 * is to read a measured width has nothing to read. The stub answers from a map
 * keyed by the element's text, which is what lets one render say 260px and the
 * next say 90px.
 *
 * It answers the way a browser does, in the two ways that decide whether the
 * hook is right: the number is an *integer*, rounded from text that is not one,
 * and it is the width of the *box* whenever the box is the wider of the two —
 * so a value the hook has already written to `style.width` is what it reads
 * back, unless it lifts that width before reading. Both are what `widths`
 * holding a fraction is for.
 *
 * The property stays on the prototype for the rest of the file — replacing it
 * is cheap, removing it is not, and an empty map answers 0, which is exactly
 * what happy-dom answered before. The `afterEach` empties the map, so no test
 * here inherits another's widths and no test elsewhere sees anything new.
 */
const widths = new Map<string, number>()
let stubbed = false

function stubScrollWidth() {
  if (stubbed) return
  stubbed = true
  // Both prototypes: happy-dom puts `scrollWidth` on `Element` and `clientWidth`
  // on `HTMLElement`, and a definition on the wrong one is silently shadowed.
  for (const prototype of [window.Element.prototype, window.HTMLElement.prototype]) {
    for (const property of ["scrollWidth", "clientWidth"] as const) {
      Object.defineProperty(prototype, property, {
        configurable: true,
        get(this: Element) {
          const content = widths.get(this.textContent ?? "") ?? 0
          const applied = Number.parseFloat((this as HTMLElement).style?.width ?? "")
          const box = Number.isNaN(applied) ? content : applied
          // `scrollWidth` is the scrollable overflow, which is the content when
          // it spills and the box when it fits; `clientWidth` is only ever the
          // box. Both are rounded, because a browser's are.
          return Math.round(property === "scrollWidth" ? Math.max(content, box) : box)
        },
      })
    }
  }
}

afterEach(() => {
  widths.clear()
})

describe("SteadyWidth reserves every string the slot can hold", () => {
  test("the candidates are drawn beside the current one, hidden and unnamed", () => {
    render(
      <output>
        <SteadyWidth candidates={["Copy", "Copied"]}>Copy</SteadyWidth>
      </output>,
    )

    const slot = screen.getByRole("status").firstElementChild as HTMLElement
    // Both words are in the box — that is what makes it as wide as the longer
    // one — and the box is a single grid cell, so they are stacked rather than
    // laid out in a row.
    expect(slot.className).toContain("grid-cols-1")
    expect(slot.className).toContain("grid-rows-1")
    const cells = Array.from(slot.children) as HTMLElement[]
    expect(cells.map((cell) => cell.textContent)).toEqual(["Copy", "Copied", "Copy"])

    // Everything but the last is a sizer: it takes space and says nothing.
    for (const sizer of cells.slice(0, -1)) {
      expect(sizer).toHaveAttribute("aria-hidden", "true")
      expect(sizer.className).toContain("invisible")
    }
    expect(cells[cells.length - 1]).not.toHaveAttribute("aria-hidden")
  })

  test("the accessible name is the current word once, not both", () => {
    render(
      <Button>
        <SteadyWidth candidates={["Copy", "Copied"]}>Copied</SteadyWidth>
      </Button>,
    )

    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument()
  })
})

describe("useSteadyWidth keeps the widest width it has held", () => {
  const Probe = ({ shape, text }: { shape: string; text: string }) => {
    const { ref, style } = useSteadyWidth<HTMLSpanElement>(shape)
    return (
      <span data-testid="probe" ref={ref} style={style} className="truncate">
        {text}
      </span>
    )
  }

  const probe = () => screen.getByTestId("probe")

  test("it reserves a pixel more than it measured", () => {
    stubScrollWidth()
    widths.set("Donnerstag, 24. September 2026", 260)

    render(<Probe shape="day|de-DE|" text="Donnerstag, 24. September 2026" />)

    // The pixel is the rounding, not generosity: see the fractional case below.
    expect(probe().style.width).toBe("261px")
  })

  test("a narrower label does not give the width back", () => {
    stubScrollWidth()
    widths.set("Donnerstag, 24. September 2026", 260)
    widths.set("Fr, 2.10.2026", 90)

    const { rerender } = render(<Probe shape="day|de-DE|" text="Donnerstag, 24. September 2026" />)
    rerender(<Probe shape="day|de-DE|" text="Fr, 2.10.2026" />)

    // The point of the whole exercise: `Today` and the forward chevron are
    // still where the reader left them.
    expect(probe().style.width).toBe("261px")
  })

  test("a wider label takes the extra width and keeps it", () => {
    stubScrollWidth()
    widths.set("September 2026", 140)
    widths.set("Donnerstag, 24. September 2026", 260)

    const { rerender } = render(<Probe shape="day|de-DE|" text="September 2026" />)
    expect(probe().style.width).toBe("141px")

    rerender(<Probe shape="day|de-DE|" text="Donnerstag, 24. September 2026" />)
    expect(probe().style.width).toBe("261px")

    rerender(<Probe shape="day|de-DE|" text="September 2026" />)
    expect(probe().style.width).toBe("261px")
  })

  test("a change of shape drops the reservation instead of stranding it", () => {
    stubScrollWidth()
    widths.set("Donnerstag, 24. September 2026", 260)
    widths.set("2026", 40)

    const { rerender } = render(<Probe shape="day|de-DE|" text="Donnerstag, 24. September 2026" />)
    rerender(<Probe shape="year|de-DE|" text="2026" />)

    // A year is four characters. Holding 260px open for it would be the same
    // defect wearing the other face.
    expect(probe().style.width).toBe("41px")
  })

  test("text whose width rounds down is not reserved short", () => {
    stubScrollWidth()
    // The reported case, to the tenth of a pixel: `September 2026` in the
    // toolbar heading is 115.2px of Outfit, `scrollWidth` says 115, and a box
    // reserved at 115 cuts its own label to `September 202…` — at 3440px, with
    // nothing else on the row asking for the space (comment on /month-view).
    widths.set("September 2026", 115.2)

    const { rerender } = render(<Probe shape="month|de-DE|" text="September 2026" />)
    expect(probe().style.width).toBe("116px")

    // And the pixel of slack does not compound. The measurement is taken with
    // the reservation lifted, so a second pass reads the same 115 rather than
    // the 116 it wrote — reading through the box is what would make this 117,
    // then 118, for as long as the component renders.
    rerender(<Probe shape="month|de-DE|" text="September 2026" />)
    rerender(<Probe shape="month|de-DE|" text="September 2026" />)
    expect(probe().style.width).toBe("116px")
  })

  test("an unmeasurable box reserves nothing at all", () => {
    stubScrollWidth()

    render(<Probe shape="day|de-DE|" text="Donnerstag, 24. September 2026" />)

    // No layout engine, no reservation — and so the prerender and the first
    // client render agree on a bare element.
    expect(probe().getAttribute("style")).toBeNull()
  })
})

describe("the calendar toolbar holds its date bar still", () => {
  const date = new CalendarDate(2026, 9, 24)

  test("the heading truncates and carries the reservation", () => {
    render(
      <CalendarToolbar
        label="Donnerstag, 24. September 2026"
        labelVariant="picker"
        date={date}
        onDateChange={() => {}}
        onPrevious={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    )

    const heading = screen.getByRole("button", { name: /24\. September 2026/ })
    const label = heading.querySelector("span.truncate") as HTMLElement
    // The reservation is a `width` on a truncating box, so a 390px viewport
    // still wins over it and the group stays inside its card (task #208).
    expect(label).toHaveTextContent("Donnerstag, 24. September 2026")
  })

  test("the pending spinner has a slot whether or not it is spinning", () => {
    const { rerender } = render(<CalendarToolbar label="24. September 2026" onNext={() => {}} />)

    const slot = () => document.querySelector("[data-slot=calendar-toolbar-pending]")
    // The box is there when nothing is in flight: a spinner that appears on the
    // press would otherwise push the whole group sideways at the moment the
    // reader is aiming at it.
    expect(slot()).toBeInTheDocument()
    expect(slot()?.textContent).toBe("")

    rerender(<CalendarToolbar label="24. September 2026" onNext={() => {}} isPending />)
    expect(slot()).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Loading…" })).toBeInTheDocument()
  })

  test("the collapsed view trigger is as wide as its longest view", async () => {
    const user = userEvent.setup()

    const Switching = () => {
      const [view, setView] = useState("day")
      return (
        <CalendarToolbar
          label="24. September 2026"
          view={view}
          views={["day", "week", "month", "timeline"]}
          viewVariant="menu"
          onViewChange={setView}
        />
      )
    }
    render(<Switching />)

    const trigger = screen.getByRole("button", { name: "Calendar view: Day" })
    const sizers = Array.from(trigger.querySelectorAll("[data-slot=steady-width] > *"))
    expect(sizers.map((sizer) => sizer.textContent)).toEqual([
      "Day",
      "Week",
      "Month",
      "Timeline",
      "Day",
    ])

    // And the set does not change when the selection does — the box was
    // already the width of `Timeline` before anyone chose it.
    await user.click(trigger)
    await user.click(screen.getByRole("menuitemradio", { name: "Timeline" }))
    const after = Array.from(trigger.querySelectorAll("[data-slot=steady-width] > *"))
    expect(after.map((sizer) => sizer.textContent)).toEqual([
      "Day",
      "Week",
      "Month",
      "Timeline",
      "Timeline",
    ])
  })
})

describe("a copy button does not resize on the press", () => {
  test("Snippet reserves the longer of Copy and Copied", async () => {
    const user = userEvent.setup()
    render(<Snippet text="bun add quebi" />)

    const button = screen.getByRole("button", { name: "Copy command" })
    const sizers = Array.from(button.querySelectorAll("[data-slot=steady-width] > *"))
    expect(sizers.map((sizer) => sizer.textContent)).toEqual(["Copy", "Copied", "Copy"])

    await user.click(button)
    const after = Array.from(button.querySelectorAll("[data-slot=steady-width] > *"))
    expect(after.map((sizer) => sizer.textContent)).toEqual(["Copy", "Copied", "Copied"])
  })
})
