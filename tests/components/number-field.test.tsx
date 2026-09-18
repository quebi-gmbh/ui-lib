/**
 * A focused NumberField must not step on a page scroll (task #156).
 *
 * `useNumberField` wires `useScrollWheel` in, gated on nothing but focus — so
 * for exactly as long as the caret is in the field, a wheel tick changes the
 * value *and* `preventDefault`s the scroll, which means the page does not even
 * move to show what was lost. No pointer press, no keystroke, no undo.
 *
 * This is invisible to types and to lint: `isWheelDisabled` is an optional
 * prop, and leaving it out is a valid call in every checker the repo runs. So
 * the default is pinned here, in both directions — off by default, and back
 * again for a caller who passes `isWheelDisabled={false}`, because wheel
 * stepping is a real affordance on a desktop spinner and this is a default,
 * not a removal.
 */
import { describe, expect, test } from "bun:test"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { NumberField, NumberInput } from "../../src/components/number-field"

/**
 * A wheel tick over the element, as the browser sends it.
 *
 * react-aria listens for `wheel` natively on the input (`useEvent`), not
 * through React's synthetic system, so this has to be a real dispatched event
 * with a real `deltaY` — and the handler ignores a tick whose `deltaX`
 * dominates, so the vertical component must be the larger one. The `act` wrap
 * is load-bearing rather than tidy: without it the step lands outside React's
 * batch and the assertion reads a stale value, which would make this test pass
 * against the broken component.
 */
const wheel = (element: HTMLElement, deltaY: number) =>
  act(() => {
    fireEvent.wheel(element, { deltaY, deltaX: 0 })
  })

function renderField(props: { isWheelDisabled?: boolean } = {}) {
  render(
    <NumberField defaultValue={4} aria-label="Quantity" {...props}>
      <NumberInput />
    </NumberField>,
  )
  const input = screen.getByRole("textbox", { name: "Quantity" })
  // The gesture is gated on focus-within, which is the whole problem: it is
  // live exactly when someone is reading the rest of the form.
  act(() => {
    input.focus()
  })
  return input
}

describe("a focused NumberField and the wheel", () => {
  test("scrolling the page over it leaves the value alone", () => {
    const input = renderField()

    // One tick, in one direction: an up-tick and a down-tick would cancel out
    // and this would pass against the broken component.
    wheel(input, 120)

    expect(input).toHaveValue("4")
  })

  test("isWheelDisabled={false} gives the stepper gesture back", () => {
    const input = renderField({ isWheelDisabled: false })

    // react-aria reads a downward tick as an increment, so this decrements.
    wheel(input, -120)

    expect(input).toHaveValue("3")
  })
})
