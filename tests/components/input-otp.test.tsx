/**
 * Where a click on an InputOTP puts the caret.
 *
 * The control looks like six fields and is one: a single `<input>` stretched
 * across the slots, drawing its value transparently at `letter-spacing: -.5em`
 * so the whole code occupies a few pixels at the left edge. The caret a browser
 * derives from a click therefore says nothing about which slot was aimed at,
 * and `OTPInput`'s `onFocus` snaps it to the end of the value on top of that —
 * so `InputOTP` maps the click back to a slot itself, from the slot geometry.
 *
 * Both halves are behaviour someone could change by accident, and only one of
 * them is a bug. Clicking a digit you have typed must land on that digit.
 * Clicking a slot *ahead* of the code must keep landing on the first empty one:
 * there is no offset in the string for a caret to sit at out there, and a code
 * with a hole in it has no representation in a single value. Task #109.
 *
 * happy-dom has no layout and no default actions, so a click is assembled from
 * its parts: stubbed slot rects, a `pointerDown`, then the `focus()` the
 * browser would run as that event's default action — including the snap it
 * triggers, which is exactly what the correction has to beat.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { act, render } from "@testing-library/react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../src/components/input-otp"

const SLOT_WIDTH = 40
const MAX_LENGTH = 6

/** The horizontal centre of slot `index`, in the stubbed layout below. */
const centreOf = (index: number) => index * SLOT_WIDTH + SLOT_WIDTH / 2

function renderOTP(value: string) {
  const { container } = render(
    <InputOTP maxLength={MAX_LENGTH} value={value} onChange={() => {}} aria-label="Code">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>,
  )

  const input = container.querySelector<HTMLInputElement>('input[data-slot="input-otp"]')
  if (!input) throw new Error("no OTP input rendered")

  // The row of slots the hit test measures. happy-dom reports every rect as
  // zero, so the layout the component reads is the one given here.
  const slots = Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
  )
  slots.forEach((slot, index) => {
    slot.getBoundingClientRect = () =>
      ({
        left: index * SLOT_WIDTH,
        right: (index + 1) * SLOT_WIDTH,
        top: 0,
        bottom: SLOT_WIDTH,
        width: SLOT_WIDTH,
        height: SLOT_WIDTH,
        x: index * SLOT_WIDTH,
        y: 0,
      }) as DOMRect
  })

  return { input, slots }
}

/**
 * Click slot `index`, the way a browser delivers one: the pointerdown handler
 * runs first, then the default action focuses the input — which is where
 * `OTPInput` snaps the caret to the end of the value.
 */
async function clickSlot(input: HTMLInputElement, index: number, alreadyFocused = false) {
  await act(async () => {
    input.dispatchEvent(
      new window.PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: centreOf(index),
      }),
    )
    if (!alreadyFocused) input.focus()
  })
  // The correction is deferred to the frame after focus. The wait that follows
  // is for `OTPInput`, which re-reads the selection at 0, 10 and 50ms after a
  // focus change; left running past the test they are updates outside `act`.
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    await new Promise((resolve) => setTimeout(resolve, 60))
  })
}

describe("InputOTP click targeting", () => {
  let originalPointerEvent: typeof window.PointerEvent

  beforeEach(() => {
    // happy-dom ships no PointerEvent; React reads `clientX` and `button` off
    // whatever the event is, so a MouseEvent under the name is enough.
    originalPointerEvent = window.PointerEvent
    if (!originalPointerEvent) {
      window.PointerEvent = window.MouseEvent as unknown as typeof window.PointerEvent
    }
  })

  afterEach(() => {
    window.PointerEvent = originalPointerEvent
  })

  test("clicking a slot you have typed selects that slot, not the end of the value", async () => {
    const { input } = renderOTP("123456")

    await clickSlot(input, 2)

    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(3)
  })

  test("the same click works once the control is already focused", async () => {
    const { input } = renderOTP("123456")
    await act(async () => {
      input.focus()
    })

    await clickSlot(input, 0, true)

    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(1)
  })

  test("a slot ahead of the typed code stays unaddressable — the caret goes to the first empty one", async () => {
    const { input } = renderOTP("23")

    await clickSlot(input, 3)

    // Offset 2 is the end of "23", which is the first empty slot. There is no
    // offset 3 to select: the value has no character there.
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(2)
  })

  test("the last typed slot is still reachable when the code is partial", async () => {
    const { input } = renderOTP("23")

    await clickSlot(input, 1)

    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(2)
  })

  test("every slot carries the index the hit test reads back", () => {
    const { slots } = renderOTP("")

    expect(slots.map((slot) => slot.dataset.index)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ])
  })
})
