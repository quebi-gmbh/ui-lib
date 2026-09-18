/**
 * Every ColorField example renders something you can actually type into.
 *
 * `ColorField` renders its hex `ColorInput` only when no children are passed
 * (`src/components/color-field.tsx`), so an example that composes a `Label` and
 * forgets the input renders a label with nothing under it — and the label's
 * `for` points at an id no element carries. That shipped: four of the five
 * gallery examples were label-only (task #125), and `*.examples.tsx` is handed
 * to agents verbatim through `/api/components/<slug>.json`, so the broken
 * snippet is what a consumer asking for "a ColorField with a label" gets back.
 *
 * Nothing else catches it. It type-checks, it lints, it prerenders, and it
 * looks like a slightly short card. So the assertion is the user's: is there a
 * control here, and does the label point at it?
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColorField, ColorInput } from "../../src/components/color-field"
import { Label } from "../../src/components/field"
import { colorFieldExamples } from "../../src/registry/color-field.examples"

describe("the ColorField gallery", () => {
  test.each(colorFieldExamples.map((example) => [example.title, example] as const))(
    "%s renders a text input",
    (_title, example) => {
      render(example.render())

      expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0)
    },
  )

  test.each(colorFieldExamples.map((example) => [example.title, example] as const))(
    "%s labels its input rather than nothing",
    (_title, example) => {
      const { container } = render(example.render())

      for (const label of Array.from(container.querySelectorAll("label"))) {
        // `htmlFor` with no matching element is exactly the shape of the bug:
        // react-aria generated an id for a control that was never rendered.
        expect(label.htmlFor).not.toBe("")
        expect(container.querySelector(`#${CSS.escape(label.htmlFor)}`)).not.toBeNull()
      }
    },
  )

  test("a composed ColorField accepts typing", async () => {
    const user = userEvent.setup()
    render(
      <ColorField defaultValue="#0EA5E9">
        <Label>Brand color</Label>
        <ColorInput />
      </ColorField>,
    )

    // Queried by role, not by name: a labelled ColorField's accessible name is
    // currently "Color field Brand color", because the component's fallback
    // `aria-label` applies even when a visible Label is present. That is a
    // separate bug (task #147) and not what this file is about.
    const input = screen.getByRole("textbox")
    await user.clear(input)
    await user.type(input, "#22D3EE")

    expect(input).toHaveValue("#22D3EE")
  })
})
