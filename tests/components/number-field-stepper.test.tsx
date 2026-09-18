/**
 * Which glyph a NumberField stepper draws, and what that glyph may not change.
 *
 * `stepper` picks the icon pair and nothing else (task #111). Two things make
 * that claim breakable by accident. The first is direction: `plus-minus` is
 * symmetric about which button is which — swapping the two icons produces a
 * control nobody would call wrong on sight — but `chevron` and `arrow` are
 * not, and a pair mapped the wrong way round points the decrement button up.
 * The second is geometry: the variants were chosen to be icons only, so the
 * three must render the same two buttons with the same classes, or `stepper`
 * silently becomes a size prop and the ~74px that `hideStepper` and
 * `@/lib/field-size` both argue from stops being one number.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NumberField, NumberInput, type NumberInputStepper } from "../../src/components/number-field"

// `tests/dom.ts` preloads RTL's `cleanup` as a global afterEach, so a render
// here does not leak into the next test.
const stepper = (name: "Decrease" | "Increase") => screen.getByRole("button", { name })
/** The lucide icon a button draws, as the name lucide puts in its class list. */
const glyphOf = (button: HTMLElement) =>
  button.querySelector("svg")?.getAttribute("class")?.match(/lucide-([a-z-]+)/)?.[1]

function renderField(props: { stepper?: NumberInputStepper } = {}) {
  return render(
    <NumberField defaultValue={4} minValue={0} aria-label="Quantity">
      <NumberInput {...props} />
    </NumberField>,
  )
}

describe("the stepper glyphs", () => {
  test.each([
    [undefined, "minus", "plus"],
    ["plus-minus", "minus", "plus"],
    ["chevron", "chevron-down", "chevron-up"],
    ["arrow", "arrow-down", "arrow-up"],
  ] as const)("stepper=%s draws %s / %s", (variant, decrease, increase) => {
    renderField(variant ? { stepper: variant } : {})
    // Left out means plus-minus: the site's existing pages must not move.
    expect(glyphOf(stepper("Decrease"))).toBe(decrease)
    expect(glyphOf(stepper("Increase"))).toBe(increase)
  })
})

describe("what the glyph may not change", () => {
  test.each(["plus-minus", "chevron", "arrow"] as const)(
    "stepper=%s keeps the pair's labels and box",
    (variant) => {
      const plain = renderField()
      const baseline = [stepper("Decrease"), stepper("Increase")].map((b) => b.className)
      plain.unmount()

      renderField({ stepper: variant })
      expect([stepper("Decrease"), stepper("Increase")].map((b) => b.className)).toEqual(baseline)
    },
  )

  test("a chevron button still steps the direction it is labelled", async () => {
    const user = userEvent.setup()
    renderField({ stepper: "chevron" })
    const input = screen.getByRole("textbox", { name: "Quantity" }) as HTMLInputElement

    await user.click(stepper("Increase"))
    expect(input.value).toBe("5")
    await user.click(stepper("Decrease"))
    expect(input.value).toBe("4")
  })
})
