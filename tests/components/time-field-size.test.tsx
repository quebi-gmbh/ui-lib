/**
 * TimeField's type size (task #173).
 *
 * A DaySchedule drew its static edge times at 10.5px and its editable ones at
 * 14px, and no className could reconcile them: `TimeInput` merged what it was
 * given onto the wrapper, then set `text-sm text-quebi-fg` again on every
 * segment, where nothing could reach it. `DateField` had had the `size`
 * scale for a while; `TimeField` had never been given it.
 *
 * Two things fix that and both are easy to undo by reflex, so they are
 * pinned here. `TimeInput` takes `Input`'s three-step `size` and reads
 * `FieldSizeContext` when it is not given one. And the segment carries no
 * resting `text-*` at all — it is `inline`, so size, colour and numeral
 * width inherit from the wrapper, which is what makes the wrapper's
 * className the one place that decides them. Putting a `text-sm` back on
 * the segment for clarity would look harmless and would silently re-break
 * DaySchedule.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { FieldSizeContext } from "../../src/lib/field-size"
import { TimeField, TimeInput } from "../../src/components/time-field"

/** The DateInput wrapper — the element a TimeInput className lands on. */
function wrapperOf(container: HTMLElement) {
  const wrapper = container.querySelector('[role="group"]')
  if (!wrapper) throw new Error("no time input")
  return wrapper as HTMLElement
}

/** Every rendered segment, digits and literals alike. */
function segmentsOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-type]")) as HTMLElement[]
}

describe("the size scale", () => {
  test("defaults to md, and xs takes the type down with the padding", () => {
    const md = render(
      <TimeField aria-label="start">
        <TimeInput />
      </TimeField>,
    )
    expect(wrapperOf(md.container).className).toContain("text-sm")
    expect(wrapperOf(md.container).className).toContain("px-3 py-2.5")
  })

  test("xs is 12px type and the xs padding", () => {
    const xs = render(
      <TimeField aria-label="start">
        <TimeInput size="xs" />
      </TimeField>,
    )
    const className = wrapperOf(xs.container).className
    expect(className).toContain("text-xs")
    expect(className).not.toContain("text-sm")
    expect(className).toContain("px-2.5 py-1.5")
  })

  test("follows the surrounding surface when given no prop of its own", () => {
    const sizing = { size: "xs" as const, hideStepper: true }
    const { container } = render(
      <FieldSizeContext value={sizing}>
        <TimeField aria-label="start">
          <TimeInput />
        </TimeField>
      </FieldSizeContext>,
    )
    expect(wrapperOf(container).className).toContain("text-xs")
  })

  test("an explicit prop still outranks the surface", () => {
    const sizing = { size: "xs" as const, hideStepper: true }
    const { container } = render(
      <FieldSizeContext value={sizing}>
        <TimeField aria-label="start">
          <TimeInput size="md" />
        </TimeField>
      </FieldSizeContext>,
    )
    expect(wrapperOf(container).className).toContain("text-sm")
  })
})

describe("the segments", () => {
  test("carry no type size of their own, so they inherit one", () => {
    const { container } = render(
      <TimeField aria-label="start">
        <TimeInput />
      </TimeField>,
    )
    const segments = segmentsOf(container)
    expect(segments.length).toBeGreaterThan(0)
    for (const segment of segments) {
      expect(segment.className).not.toMatch(/\btext-(sm|xs|base)\b/)
      // The affordance stays — it is spacing, not a size.
      expect(segment.className).toContain("tracking-wider")
    }
  })

  test("carry no resting colour either — DaySchedule needs a muted one", () => {
    const { container } = render(
      <TimeField aria-label="start">
        <TimeInput />
      </TimeField>,
    )
    for (const segment of segmentsOf(container)) {
      // Only as a focus/placeholder state, never as the resting style.
      expect(segment.className).not.toMatch(/(^|\s)text-quebi-fg(\s|$)/)
    }
  })

  test("a className on TimeInput reaches the digits — the DaySchedule case", () => {
    const { container } = render(
      <TimeField aria-label="start">
        <TimeInput bare className="text-[10.5px] text-quebi-fg-muted tabular-nums" />
      </TimeField>,
    )
    const className = wrapperOf(container).className
    // All three survive the merge, and the defaults they override do not.
    expect(className).toContain("text-[10.5px]")
    expect(className).toContain("text-quebi-fg-muted")
    expect(className).toContain("tabular-nums")
    expect(className).not.toContain("text-sm")
  })
})
