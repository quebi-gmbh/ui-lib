"use client"

import { use } from "react"
import type { ColorFieldProps, ColorSwatchProps, InputProps } from "react-aria-components"
import {
  ColorField as ColorFieldPrimitive,
  ColorFieldStateContext,
  composeRenderProps,
  Group,
  Input as InputPrimitive,
  parseColor,
} from "react-aria-components"
import { ColorSwatch } from "@/components/color-swatch"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"

/**
 * ColorField — quebi design system
 *
 * Built on react-aria-components. An accessible text input for editing a color
 * as a hex value (e.g. `#0EA5E9`), with a live swatch of that color inside the
 * field so the value is visible and not only readable.
 *
 * Pass children to compose your own control; otherwise a {@link ColorFieldGroup}
 * — the hex {@link ColorInput} with its leading {@link ColorFieldSwatch} — is
 * rendered automatically so the field works standalone. Composing children is
 * also how you opt out of the swatch: a bare `<ColorInput />` as the child is
 * the old text-box-only field. The Conform color-field variant composes the
 * group explicitly, alongside a label and an error message.
 *
 * Children mean *all* of the inside, including the control — the same contract
 * `TextField`, `SearchField`, `DateField` and `Select` publish, none of which
 * default a control at all. So composing a `<Label>` and forgetting the input
 * gives you a label with nothing under it (task #148, and it shipped once:
 * #125). That stays a composition error rather than something the field
 * repairs, because repairing it means appending an input the field cannot
 * place — the label → control → hint stack is an ordering, and a control
 * inserted after a `FieldError` is a different bug — and cannot even be
 * detected when children are a render function, which react-aria allows.
 *
 * A focused field does *not* step on the wheel: `isWheelDisabled` defaults to
 * `true` here, inverting react-aria's default. See {@link ColorFieldProps}.
 */
export function ColorField({
  className,
  children,
  // react-aria turns a wheel tick over a *focused* field into a value step,
  // and `preventDefault`s the scroll, so the page does not move either: an
  // ordinary read-the-rest-of-the-form scroll silently rewrites the colour
  // with no press, no keystroke and no undo (task #156). Wheel stepping is a
  // real desktop affordance, so this is a default and not a removal — pass
  // `isWheelDisabled={false}` to ask for it back.
  isWheelDisabled = true,
  ...props
}: ColorFieldProps) {
  return (
    <ColorFieldPrimitive
      {...props}
      isWheelDisabled={isWheelDisabled}
      // Only name the field when nothing else does. Unconditionally, this
      // fallback *doubles* the name of every labelled field: react-aria folds
      // an `aria-label` into the input's own `aria-labelledby` chain alongside
      // the `<Label>`, so a field labelled "Brand color" announced itself as
      // "Color field Brand color" (task #147). Children are the proxy for "a
      // Label is in there", because composing them is the only way to put one
      // there; `aria-labelledby` is the other way to name the standalone
      // field. Same shape as the month / week / year pickers.
      aria-label={
        props["aria-label"] ?? (children || props["aria-labelledby"] ? undefined : "Color field")
      }
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        // The stack from the one place that owns it.
        cn(fieldStyles, resolved),
      )}
    >
      {children ?? <ColorFieldGroup />}
    </ColorFieldPrimitive>
  )
}

export interface ColorFieldGroupProps {
  /** The control inside the field. Defaults to the hex {@link ColorInput}. */
  children?: React.ReactNode
  className?: string
}

/**
 * ColorFieldGroup — a {@link ColorField}'s input with its color chip.
 *
 * The swatch sits at the start of the input, inside the border, on the same
 * adornment geometry `InputGroup` uses for a leading icon: absolutely
 * positioned, out of the pointer path, with the input padded to make room. One
 * rectangle, so the field's label/description/error stack is unchanged.
 */
export function ColorFieldGroup({ children, className }: ColorFieldGroupProps) {
  return (
    <Group
      data-slot="control"
      className={cn(
        "relative isolate block w-full",
        // Room for the chip the swatch draws over the start of the field,
        // past the field's own inline padding.
        "[&_input]:ps-[calc(var(--q-field-px)+--spacing(8))]",
        className,
      )}
    >
      <ColorFieldSwatch />
      {children ?? <ColorInput />}
    </Group>
  )
}

/**
 * ColorFieldSwatch — the live color chip inside a {@link ColorField}.
 *
 * Reads the field's own state off `ColorFieldStateContext`, so it takes no
 * color prop and needs no state lifted out of the field. What it shows is the
 * color the field would hold if it were committed right now — which is what
 * react-aria does on blur, so the chip is never showing something the input is
 * about to contradict:
 *
 * - the input parses → that color, live, as the user types;
 * - it does not parse → the last committed color, which is what blur restores;
 * - it is empty → nothing, which is what blur commits.
 *
 * "Nothing" is a fully transparent swatch rather than no element, so the
 * field's geometry never moves; react-aria's own swatch renders `#fff0` for a
 * missing color and labels it "transparent".
 */
export function ColorFieldSwatch({ className, ...props }: ColorSwatchProps) {
  const state = use(ColorFieldStateContext)

  return (
    <ColorSwatch
      color={liveColor(state) ?? undefined}
      className={composeRenderProps(className, (resolved) =>
        cn(
          "pointer-events-none absolute start-(--q-field-px) top-1/2 z-10 size-5 -translate-y-1/2",
          "in-data-[disabled]:opacity-50",
          resolved,
        ),
      )}
      {...props}
    />
  )
}

/** The color a {@link ColorField}'s state would commit to right now. */
function liveColor(state: React.ContextType<typeof ColorFieldStateContext>) {
  if (!state) return null
  // A `channel` ColorField puts a NumberFieldState in the same context. Its
  // inputValue is a channel number ("180"), which would parse as the hex
  // #118800, and its colorValue is already the whole color — so leave it alone.
  if ("numberValue" in state) return state.colorValue

  const typed = state.inputValue.trim()
  if (typed === "") return null
  try {
    return parseColor(typed.startsWith("#") ? typed : `#${typed}`)
  } catch {
    return state.colorValue
  }
}

/** The hex text input inside a {@link ColorField}. */
export function ColorInput({ className, ...props }: InputProps) {
  return (
    <InputPrimitive
      {...props}
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "relative block w-full appearance-none text-sm text-quebi-fg tabular-nums uppercase",
          "placeholder:text-quebi-fg-subtle placeholder:normal-case",
          // `Input`'s frame at `md`; focus doubles it, no ring.
          "quebi-field px-(--q-field-px) py-2.5",
          "transition-[border-color,box-shadow] duration-150",
          "outline-none focus:outline-none focus:shadow-(--q-field-focus)",
          "invalid:[--q-field-edge:var(--q-danger)] data-invalid:[--q-field-edge:var(--q-danger)]",
          "focus:invalid:shadow-(--q-field-focus-danger) focus:data-invalid:shadow-(--q-field-focus-danger)",
          "disabled:cursor-not-allowed disabled:opacity-50 in-disabled:opacity-50",
          resolved,
        ),
      )}
    />
  )
}

export type { ColorFieldProps }
