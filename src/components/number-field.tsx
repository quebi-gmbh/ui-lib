"use client"

import { MinusIcon, PlusIcon } from "lucide-react"
import type { InputProps, NumberFieldProps } from "react-aria-components"
import {
  Button,
  Group,
  Input as InputPrimitive,
  NumberField as NumberFieldPrimitive,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * NumberField — quebi design system
 *
 * Built on react-aria-components. Wraps the label → control → hint stack and
 * gives the control number-aware behaviour (parsing, stepping, formatting).
 * Pair with the field primitives (`Label`, `Description`, `FieldError`).
 */
function NumberField({ className, ...props }: NumberFieldProps) {
  return (
    <NumberFieldPrimitive
      {...props}
      data-slot="control"
      className={cn(
        "group/number-field w-full",
        // label → control → hint stack with 6px between siblings.
        "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=label]+[slot='description']]:mt-1",
        "[&>[slot=description]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=control]+[slot=description]]:mt-1.5",
        "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
        "in-disabled:opacity-50 disabled:opacity-50",
        className,
      )}
    />
  )
}

interface NumberInputProps extends Omit<InputProps, "prefix"> {
  /** Text / glyph rendered in a tag attached to the left edge (e.g. `£`). */
  prefix?: React.ReactNode
  /** Text / glyph rendered in a tag attached to the right edge (e.g. `GB`). */
  suffix?: React.ReactNode
  /** Hide the increment / decrement stepper buttons. */
  hideStepper?: boolean
}

const addonStyles = cn(
  "inline-flex select-none items-center px-3 text-[13px] font-medium",
  "pointer-events-none bg-white/[0.02] text-quebi-fg-muted",
  "border border-cyan-500/20",
  "transition-[border-color] duration-200",
  "group-hover/addons:border-cyan-500/40 group-focus-within/addons:border-quebi-brand",
)

const stepperStyles = cn(
  "inline-flex items-center justify-center px-2.5",
  "bg-white/[0.02] text-quebi-fg-muted",
  "border border-cyan-500/20",
  "transition-[color,border-color,background-color] duration-200",
  "outline-none cursor-pointer",
  "hover:border-quebi-brand hover:text-quebi-brand",
  "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-cyan-500/20 disabled:hover:text-quebi-fg-muted",
)

/**
 * NumberInput renders the input for a NumberField, with optional prefix/suffix
 * addons and increment / decrement steppers that read as one unified control
 * (shared focus ring, shared hover).
 */
function NumberInput({
  prefix,
  suffix,
  hideStepper,
  className,
  ...props
}: NumberInputProps) {
  return (
    <Group
      data-slot="control"
      className={cn(
        // Group named `addons` so the addons / steppers react to the wrapper's
        // hover and focus-within state.
        "group/addons flex w-full items-stretch rounded-quebi-sm",
        "transition-[box-shadow] duration-200",
        // Wrapper owns the outer focus ring so every segment highlights together.
        "focus-within:ring-2 focus-within:ring-quebi-brand/50",
        // Strip inner input's own ring (wrapper owns it).
        "[&_input:focus]:ring-0 [&_input:focus]:ring-transparent",
      )}
    >
      {prefix ? (
        <span data-slot="addon" className={cn(addonStyles, "rounded-s-quebi-sm border-r-0")}>
          {prefix}
        </span>
      ) : null}
      <InputPrimitive
        className={cn(
          "relative block w-full min-w-0 appearance-none text-sm text-white tabular-nums",
          "placeholder:text-quebi-fg-subtle",
          "border border-cyan-500/20 bg-white/[0.02] px-3 py-2.5",
          "transition-[border-color,box-shadow] duration-200",
          "enabled:hover:border-cyan-500/40",
          "outline-none focus:outline-none focus:border-quebi-brand",
          "invalid:border-red-500",
          "disabled:cursor-not-allowed disabled:opacity-50 in-disabled:opacity-50",
          "scheme-dark",
          // Corner rounding depends on neighbouring segments.
          prefix ? "rounded-s-none" : "rounded-s-quebi-sm",
          suffix || !hideStepper ? "rounded-e-none" : "rounded-e-quebi-sm",
          className,
        )}
        {...props}
      />
      {suffix ? (
        <span
          data-slot="addon"
          className={cn(
            addonStyles,
            "border-l-0",
            hideStepper ? "rounded-e-quebi-sm" : "",
          )}
        >
          {suffix}
        </span>
      ) : null}
      {!hideStepper ? (
        <div className="flex items-stretch">
          <Button
            slot="decrement"
            aria-label="Decrease"
            className={cn(stepperStyles, "-ml-px")}
          >
            <MinusIcon className="size-4" />
          </Button>
          <Button
            slot="increment"
            aria-label="Increase"
            className={cn(stepperStyles, "-ml-px rounded-e-quebi-sm")}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      ) : null}
    </Group>
  )
}

export type { NumberFieldProps, NumberInputProps }
export { NumberField, NumberInput }
