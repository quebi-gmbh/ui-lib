"use client"

import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react"
import type { InputProps, NumberFieldProps } from "react-aria-components"
import {
  Button,
  composeRenderProps,
  Group,
  Input as InputPrimitive,
  NumberField as NumberFieldPrimitive,
} from "react-aria-components"
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"

/**
 * NumberField — quebi design system
 *
 * Built on react-aria-components. Wraps the label → control → hint stack and
 * gives the control number-aware behaviour (parsing, stepping, formatting).
 * Pair with the field primitives (`Label`, `Description`, `FieldError`).
 *
 * A focused field does *not* step on the wheel: `isWheelDisabled` defaults to
 * `true` here, inverting react-aria's default. The steppers, the arrow keys
 * and typing are unaffected.
 */
function NumberField({
  // react-aria turns a wheel tick over a *focused* field into a value step,
  // and `preventDefault`s the scroll, so the page does not move either: an
  // ordinary read-the-rest-of-the-form scroll silently rewrites the number
  // with no press, no keystroke and no undo (task #156). Wheel stepping is a
  // real desktop affordance, so this is a default and not a removal — pass
  // `isWheelDisabled={false}` to ask for it back, on a field the pointer is
  // over on purpose.
  isWheelDisabled = true,
  className,
  ...props
}: NumberFieldProps) {
  return (
    <NumberFieldPrimitive
      {...props}
      isWheelDisabled={isWheelDisabled}
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        // The label → control → hint stack, from the one place that owns it:
        // this file used to carry a verbatim copy of `Field`'s five selectors,
        // which is how the two drifted apart in the first place.
        cn("group/number-field", fieldStyles, resolved),
      )}
    />
  )
}

/**
 * The field size scale — the same three steps `Input` publishes, so a number
 * field and the button beside it are the same height: `xs` is 30px and `sm`
 * 38px, matching `Button`'s `xs` and `sm`; `md` is the default.
 *
 * The underline belongs to the group, not the input, so it runs under the
 * addons and steppers too; the group's 1px border top (transparent) and
 * bottom is what the 1px per side in that arithmetic is. The addons and
 * steppers stretch to the input, so sizing the input sizes the whole group.
 */
const numberInputSizeStyles = {
  xs: "text-xs px-0 py-1.5",
  sm: "text-sm px-0 py-2",
  md: "text-sm px-0 py-2.5",
} as const

type NumberInputSize = keyof typeof numberInputSizeStyles

/**
 * The glyphs the stepper pair draws: decrement first, increment second.
 *
 * Only the icons change — the pair stays the side-by-side row it has always
 * been, so every variant is the same height and the same ~74px wide, and a
 * field that fits one fits all three.
 */
const numberInputStepperIcons = {
  "plus-minus": [MinusIcon, PlusIcon],
  chevron: [ChevronDownIcon, ChevronUpIcon],
  arrow: [ArrowDownIcon, ArrowUpIcon],
} as const

type NumberInputStepper = keyof typeof numberInputStepperIcons

interface NumberInputProps extends Omit<InputProps, "prefix" | "size"> {
  /** Text / glyph rendered in a tag attached to the left edge (e.g. `£`). */
  prefix?: React.ReactNode
  /** Text / glyph rendered in a tag attached to the right edge (e.g. `GB`). */
  suffix?: React.ReactNode
  /**
   * Hide the increment / decrement stepper buttons.
   *
   * Worth reaching for whenever the field is narrow: the pair costs ~74px of
   * a fixed width before a digit is drawn, and an input that is `w-full
   * min-w-0` inside a flex row will give that width up rather than overflow —
   * so a `w-24` field with steppers renders the buttons and no number.
   *
   * Left out, it is whatever the surrounding surface asked for — a table cell
   * hides them, because a grid is the narrow case and ↑ / ↓ still step. See
   * `@/lib/field-size`.
   */
  hideStepper?: boolean
  /**
   * Control height. Matches `Input`'s scale and `Button`'s `xs` / `sm`, and is
   * likewise taken from the surrounding surface when it is left out.
   */
  size?: NumberInputSize
  /**
   * Which glyphs the steppers draw. `plus-minus` is the default — the pair a
   * quantity reads best as, because +/- says "add one" without implying an
   * ordering. `chevron` and `arrow` draw the up / down pair a spinner
   * conventionally uses, which is the better read when the number is a
   * position on a scale (a page, a rank, a priority) rather than an amount.
   *
   * Geometry is not part of this choice: all three are the same horizontal
   * row, so swapping the glyph cannot change the control's size. See
   * `hideStepper` for the width that costs.
   */
  stepper?: NumberInputStepper
}

const addonStyles = cn(
  "inline-flex select-none items-center text-quebi-fg-subtle",
  "pointer-events-none",
)

const stepperStyles = cn(
  "inline-flex items-center justify-center px-1.5",
  "bg-transparent text-quebi-fg-subtle",
  "transition-colors duration-150",
  "outline-none cursor-pointer",
  "hover:text-quebi-fg",
  "focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-quebi-fg-subtle",
)

/**
 * NumberInput renders the input for a NumberField, with optional prefix/suffix
 * addons and increment / decrement steppers that read as one control: one
 * underline under all of them, thickened while anything inside has focus.
 */
function NumberInput({
  prefix,
  suffix,
  hideStepper: hideStepperProp,
  size: sizeProp,
  stepper = "plus-minus",
  className,
  ...props
}: NumberInputProps) {
  const { size, hideStepper } = useFieldSizing({ size: sizeProp, hideStepper: hideStepperProp })
  const [DecrementIcon, IncrementIcon] = numberInputStepperIcons[stepper]
  return (
    <Group
      data-slot="control"
      className={cn(
        "group/addons flex w-full items-stretch",
        "border-y border-t-transparent border-b-quebi-rule",
        "transition-[border-color,box-shadow] duration-150",
        "focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
        "group-invalid/number-field:border-b-quebi-danger group-invalid/number-field:focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
      )}
    >
      {prefix ? (
        <span data-slot="addon" className={cn(addonStyles, "pe-2")}>
          {prefix}
        </span>
      ) : null}
      <InputPrimitive
        className={composeRenderProps(className, (resolved) =>
          cn(
            "relative block w-full min-w-0 appearance-none bg-transparent text-quebi-fg tabular-nums",
            "placeholder:text-quebi-fg-subtle",
            numberInputSizeStyles[size],
            "outline-none focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 in-disabled:opacity-50",
            resolved,
          ),
        )}
        {...props}
      />
      {suffix ? (
        <span
          data-slot="addon"
          className={cn(addonStyles, "ps-2")}
        >
          {suffix}
        </span>
      ) : null}
      {!hideStepper ? (
        <div className="flex items-stretch">
          <Button
            slot="decrement"
            aria-label="Decrease"
            className={stepperStyles}
          >
            <DecrementIcon className="size-4" />
          </Button>
          <Button
            slot="increment"
            aria-label="Increase"
            className={cn(stepperStyles, "pe-0")}
          >
            <IncrementIcon className="size-4" />
          </Button>
        </div>
      ) : null}
    </Group>
  )
}

export type { NumberFieldProps, NumberInputProps, NumberInputSize, NumberInputStepper }
export { NumberField, NumberInput }
