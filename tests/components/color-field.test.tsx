/**
 * ColorField: a control in every example, and a swatch that tells the truth.
 *
 * Two bugs met in this file, both invisible to types, lint and the prerender.
 *
 * `ColorField` renders its default control only when no children are passed
 * (`src/components/color-field.tsx`), so an example that composes a `Label` and
 * forgets the control renders a label with nothing under it — and the label's
 * `for` points at an id no element carries. That shipped: four of the five
 * gallery examples were label-only (task #125), and `*.examples.tsx` is handed
 * to agents verbatim through `/api/components/<slug>.json`, so the broken
 * snippet is what a consumer asking for "a ColorField with a label" gets back.
 *
 * The other is what the field showed once you could type in it: a hex string
 * and never the colour (task #126). The chip that fixes that reads
 * `ColorFieldStateContext` rather than a prop, so nothing about it is visible
 * to type checking — and the state it reads is the subtle part. `colorValue` is
 * only updated when the field *commits* (blur, Enter, arrow keys), so a chip
 * bound straight to it would sit still while the user typed a whole new colour.
 * What is asserted below is the rule the component documents instead: the chip
 * shows the colour the field would hold if it were committed right now.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { parseColor } from "react-aria-components"
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

const swatch = () => document.querySelector<HTMLElement>('[data-slot="color-swatch"]')

/** What react-aria paints for a colour, so the test compares like with like. */
const css = (hex: string) => parseColor(hex).toString("css")

describe("the ColorField swatch", () => {
  test("a standalone field shows its value as a colour, not only as text", () => {
    render(<ColorField aria-label="Color" defaultValue="#0EA5E9" />)

    expect(screen.getByRole("textbox")).toHaveValue("#0EA5E9")
    expect(swatch()).toHaveStyle({ backgroundColor: css("#0EA5E9") })
  })

  test("the colour follows the input as it is typed, before any commit", async () => {
    const user = userEvent.setup()
    render(<ColorField aria-label="Color" defaultValue="#0EA5E9" />)

    await user.clear(screen.getByRole("textbox"))
    await user.type(screen.getByRole("textbox"), "#FF0000")

    // Still focused: react-aria has not committed, so state.colorValue is
    // untouched. The chip is red anyway, which is the whole point.
    expect(screen.getByRole("textbox")).toHaveFocus()
    expect(swatch()).toHaveStyle({ backgroundColor: css("#FF0000") })
  })

  test("a half-typed value keeps the colour blur would restore", async () => {
    const user = userEvent.setup()
    render(<ColorField aria-label="Color" defaultValue="#0EA5E9" />)

    await user.clear(screen.getByRole("textbox"))
    await user.type(screen.getByRole("textbox"), "#FF000")

    // `#FF000` does not parse (`#FF00` would — four digits is RGBA). Blur would
    // put `#0EA5E9` back, so that is what the chip shows: never a colour the
    // input is about to contradict.
    expect(swatch()).toHaveStyle({ backgroundColor: css("#0EA5E9") })
  })

  test("an empty field keeps a chip, transparent rather than absent", async () => {
    const user = userEvent.setup()
    render(<ColorField aria-label="Color" defaultValue="#0EA5E9" />)

    await user.clear(screen.getByRole("textbox"))

    // The element stays so the field's geometry does not move; react-aria
    // renders `#fff0` for a missing colour and labels it transparent.
    expect(swatch()).toBeInTheDocument()
    expect(swatch()).toHaveStyle({ backgroundColor: css("#fff0") })
  })

  test("composing a bare ColorInput is the opt-out", () => {
    render(
      <ColorField defaultValue="#22D3EE">
        <Label>Brand color</Label>
        <ColorInput />
      </ColorField>,
    )

    expect(screen.getByRole("textbox")).toHaveValue("#22D3EE")
    expect(swatch()).toBeNull()
  })

  test("a channel field is not read as a hex", () => {
    // The channel variant puts a NumberFieldState in the same context, and its
    // input value is a channel number — `180` would parse as the hex #118800.
    render(<ColorField aria-label="Hue" channel="hue" defaultValue="hsl(180, 100%, 50%)" />)

    expect(swatch()).toHaveStyle({
      backgroundColor: parseColor("hsl(180, 100%, 50%)").toString("css"),
    })
  })
})
