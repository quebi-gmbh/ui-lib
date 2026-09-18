/**
 * The EyeDropper: a height a row can live with, and a cancel that is not an
 * error (task #128).
 *
 * It used to take no props at all — `size="sq-md"` and `intent="outline"` were
 * baked in — so a consumer whose field was the field scale's `sm` (38px) had
 * nowhere to say so and got a 46px button overhanging it by 4px top and bottom.
 * `sq-md` matches no field this library ships: `Input`'s `md` is 42px on
 * purpose. So the default is `sq-sm`, and both `size` and `className` now
 * reach the Button.
 *
 * The second half is invisible until you look at a console: the browser
 * EyeDropper API rejects with `AbortError` when the pick is dismissed with Esc,
 * and nothing caught it, so every cancelled pick was an unhandled rejection.
 * The test for that listens for the process event rather than asserting on the
 * DOM, because there is nothing in the DOM to assert on — which is exactly why
 * it survived.
 */
import { afterEach, describe, expect, test } from "bun:test"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColorField, ColorInput } from "../../src/components/color-field"
import { ColorPicker, EyeDropper } from "../../src/components/color-picker"

/** Install a fake browser EyeDropper whose `open()` settles as told. */
function stubEyeDropper(settle: () => Promise<{ sRGBHex: string }>) {
  window.EyeDropper = class {
    open() {
      return settle()
    }
  }
}

afterEach(() => {
  window.EyeDropper = undefined
})

const classesOf = (element: HTMLElement) => new Set(element.className.split(/\s+/))

const dropper = () => screen.getByRole("button", { name: "Eye dropper" })

describe("the EyeDropper button's size", () => {
  test("defaults to sq-sm — 38px, the field scale's `sm`", () => {
    stubEyeDropper(() => Promise.resolve({ sRGBHex: "#14b8a6" }))
    render(
      <ColorPicker defaultValue="#000000">
        <EyeDropper />
      </ColorPicker>,
    )

    // 38px, not the 46px of `sq-md`.
    expect(classesOf(dropper())).toContain("size-9.5")
    expect(classesOf(dropper())).not.toContain("size-11.5")
  })

  test("takes a square size, so a row can name its own height", () => {
    stubEyeDropper(() => Promise.resolve({ sRGBHex: "#14b8a6" }))
    render(
      <ColorPicker defaultValue="#000000">
        <EyeDropper size="sq-md" />
      </ColorPicker>,
    )

    expect(classesOf(dropper())).toContain("size-11.5")
    expect(classesOf(dropper())).not.toContain("size-9.5")
  })

  test("a className beats the default size — 42px rows are not on that scale", () => {
    // `ConformColorPicker`'s popover row is `ColorInput`'s 42px, and Button's
    // square scale steps 38 → 46 with nothing between them.
    stubEyeDropper(() => Promise.resolve({ sRGBHex: "#14b8a6" }))
    render(
      <ColorPicker defaultValue="#000000">
        <EyeDropper className="size-10.5" />
      </ColorPicker>,
    )

    expect(classesOf(dropper())).toContain("size-10.5")
    expect(classesOf(dropper())).not.toContain("size-9.5")
  })
})

describe("picking a color", () => {
  test("a sampled color reaches the picker's state", async () => {
    const user = userEvent.setup()
    stubEyeDropper(() => Promise.resolve({ sRGBHex: "#14b8a6" }))
    render(
      <ColorPicker defaultValue="#000000">
        <ColorField aria-label="Hex color">
          <ColorInput />
        </ColorField>
        <EyeDropper />
      </ColorPicker>,
    )

    await user.click(dropper())

    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue("#14B8A6"))
  })

  test("dismissing the native picker is not an unhandled rejection", async () => {
    const user = userEvent.setup()
    const abort = () =>
      Promise.reject<{ sRGBHex: string }>(new DOMException("aborted", "AbortError"))
    stubEyeDropper(abort)
    const unhandled: unknown[] = []
    const record = (reason: unknown) => unhandled.push(reason)
    process.on("unhandledRejection", record)

    try {
      render(
        <ColorPicker defaultValue="#000000">
          <EyeDropper />
        </ColorPicker>,
      )
      await user.click(dropper())
      // One turn past the rejection: an unhandled one is reported at the end of
      // the microtask queue, so the assertion has to come after a macrotask.
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(unhandled).toEqual([])
    } finally {
      process.off("unhandledRejection", record)
    }
  })
})
