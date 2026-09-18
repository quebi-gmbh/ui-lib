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
 *
 * Two more of the same kind have since joined them: the fallback `aria-label`
 * that doubled every labelled field's announced name (#147), and the wheel
 * gesture that rewrote a focused field's value on an ordinary page scroll
 * (#156). Neither is visible to a type, a lint rule or a rendered snapshot.
 */
import { describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { parseColor } from "react-aria-components"
import { ColorField, ColorFieldGroup, ColorInput } from "../../src/components/color-field"
import { ConformColorField } from "../../src/components/conform-color-field"
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

    const input = screen.getByRole("textbox", { name: "Brand color" })
    await user.clear(input)
    await user.type(input, "#22D3EE")

    expect(input).toHaveValue("#22D3EE")
  })
})

/**
 * The fallback name, and what it may not do (task #147).
 *
 * `aria-label` is not an alternative to the `<Label>` in react-aria's hands —
 * it folds both into the input's `aria-labelledby` chain, so an unconditional
 * fallback does not lose to a visible label, it *concatenates* with it. The
 * symptom is only ever a screen-reader announcement, which no render assertion
 * and no type would catch, so the computed name is asserted directly here.
 * `getByRole(…, { name })` is an exact match on the full accessible name, so
 * the doubled "Color field Brand color" fails these.
 */
describe("the ColorField accessible name", () => {
  test("a visible Label is the whole name", () => {
    render(
      <ColorField defaultValue="#0EA5E9">
        <Label>Brand color</Label>
        <ColorFieldGroup />
      </ColorField>,
    )

    expect(screen.getByRole("textbox", { name: "Brand color" })).toBeInTheDocument()
  })

  test("a standalone field still gets named", () => {
    // No children means no Label can be in there, so the fallback is the only
    // thing standing between this control and no accessible name at all.
    render(<ColorField defaultValue="#0EA5E9" />)

    expect(screen.getByRole("textbox", { name: "Color field" })).toBeInTheDocument()
  })

  test("an explicit aria-label wins over the fallback", () => {
    render(<ColorField aria-label="Accent" defaultValue="#0EA5E9" />)

    expect(screen.getByRole("textbox", { name: "Accent" })).toBeInTheDocument()
  })

  test("aria-labelledby names a standalone field on its own", () => {
    render(
      <>
        <span id="external-color-label">Accent</span>
        <ColorField aria-labelledby="external-color-label" defaultValue="#0EA5E9" />
      </>,
    )

    // The other way to name a field that composes no Label: the fallback has
    // to yield to it too, or it doubles exactly as it did with a Label.
    expect(screen.getByRole("textbox", { name: "Accent" })).toBeInTheDocument()
  })

  test("ConformColorField's label is not doubled either", () => {
    // The same bug one layer up: the Conform variant renders `label` as a
    // `<Label>` *and* passed it as `aria-label`, so it announced the text
    // twice on its own. A real `useForm` because FieldMetadata is not worth
    // hand-faking; `tests/**/*.tsx` is scoped for the raw <form> and for a
    // `useForm` with no `lastResult` (there is no route action here).
    function App() {
      const [form, fields] = useForm<{ brand: string }>({})
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformColorField field={fields.brand} label="Brand color" />
        </form>
      )
    }
    render(<App />)

    expect(screen.getByRole("textbox", { name: "Brand color" })).toBeInTheDocument()
  })
})

/**
 * A focused ColorField must not step on a page scroll (task #156).
 *
 * See `tests/components/number-field.test.tsx` — the same react-aria gesture,
 * gated on nothing but focus, on the other field that wires it in.
 */
describe("a focused ColorField and the wheel", () => {
  /** A wheel tick, dispatched as the browser sends it: native, with a delta. */
  const wheel = (element: HTMLElement, deltaY: number) =>
    act(() => {
      fireEvent.wheel(element, { deltaY, deltaX: 0 })
    })

  const renderFocused = (props: { isWheelDisabled?: boolean } = {}) => {
    render(<ColorField aria-label="Color" defaultValue="#FF0000" {...props} />)
    const input = screen.getByRole("textbox", { name: "Color" })
    act(() => {
      input.focus()
    })
    return input
  }

  test("scrolling the page over it leaves the colour alone", () => {
    const input = renderFocused()

    // One tick, in one direction: an up-tick and a down-tick would cancel out
    // and this would pass against the broken component.
    wheel(input, 120)

    expect(input).toHaveValue("#FF0000")
  })

  test("isWheelDisabled={false} gives the gesture back", () => {
    const input = renderFocused({ isWheelDisabled: false })

    // react-aria reads a downward tick as an increment, and a ColorField steps
    // the whole hex integer — so this is the +1 that #FF0000 becomes.
    wheel(input, 120)

    expect(input).toHaveValue("#FF0001")
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
