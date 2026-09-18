"use client"

import type { DateFieldProps, DateInputProps, DateValue } from "react-aria-components"
import {
  composeRenderProps,
  DateField as DateFieldPrimitive,
  DateInput as DateInputPrimitive,
  DateSegment,
} from "react-aria-components"
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"

/**
 * DateField — quebi design system
 *
 * Built on react-aria-components. A segmented date entry control: each part
 * (day / month / year) is an individually editable segment. The wrapper uses
 * the quebi input chrome (translucent fill, cyan-tinted border, brand-teal
 * focus ring); the focused segment lights up with a brand-teal wash.
 *
 * Segment padding follows the locale, which is why `de-DE` renders `30.6.2026`
 * and not `30.06.2026`. Pass `shouldForceLeadingZeros` for the padded form —
 * it applies to the day, month and hour segments; the year is never padded.
 * Left unset the locale decides, which is the default on purpose: the same
 * prop exists on `DatePicker`, `DateRangePicker`, `TimeField` and
 * `ConformDateField`, so padding is a per-field decision rather than one the
 * library takes on everyone's behalf.
 */
export function DateField<T extends DateValue>({ className, ...props }: DateFieldProps<T>) {
  return (
    <DateFieldPrimitive
      {...props}
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn("group flex w-fit flex-col gap-1", resolved),
      )}
    />
  )
}

/**
 * The padding half of the field size scale — the same three steps `Input`
 * publishes, so a date field and the button beside it are the same height:
 * `xs` is 30px and `sm` 38px, `md` is the default and unchanged. Spelled out
 * here rather than imported so `DateField` does not gain `Input` as a registry
 * dependency for three strings; the type size travels with it below, because a
 * segmented field's height is its segments' line box.
 */
const dateInputSizeStyles = {
  xs: "px-2.5 py-1.5",
  sm: "px-3 py-2",
  md: "px-3 py-2.5",
} as const

type DateInputSize = keyof typeof dateInputSizeStyles

/** `bare` strips the input chrome (border, bg, rounding, focus ring, padding)
 *  so the DateInput can be composed inside a wrapper that owns those — e.g.
 *  a DatePickerTrigger which adds a calendar-icon button on the right. */
interface DateInputComponentProps extends Omit<DateInputProps, "children"> {
  bare?: boolean
  /**
   * Control height. Matches `Input`'s scale. Left out, it is whatever the
   * surrounding surface asked for — a table cell being the one that does. See
   * `@/lib/field-size`.
   */
  size?: DateInputSize
}

export function DateInput({
  className,
  bare = false,
  size: sizeProp,
  ...props
}: DateInputComponentProps) {
  const { size } = useFieldSizing({ size: sizeProp })
  const textSize = size === "xs" ? "text-xs" : "text-sm"
  return (
    <span data-slot="control" className={bare ? "relative block w-full" : "relative block"}>
      <DateInputPrimitive
        className={composeRenderProps(className, (resolved) =>
          cn(
            "relative block appearance-none text-quebi-fg",
            textSize,
            bare
              ? ["w-full rounded-none border-0 bg-transparent outline-none", dateInputSizeStyles[size]]
              : [
                  // quebi input chrome — matches input.tsx.
                  "rounded-quebi-sm border border-quebi-line/20 bg-quebi-surface/[0.02]",
                  dateInputSizeStyles[size],
                  "transition-[border-color,box-shadow] duration-200",
                  // `DateInput` is a `<div role="group">`, so the `enabled:` this line used
                  // to carry never matched and the field had no hover feedback at all,
                  // despite the chrome above claiming to match `Input`. The guards are what
                  // `enabled:` was standing in for: hover must not outrank focus-within or
                  // the open state, and must stay off a disabled field.
                  "not-aria-disabled:not-focus-within:not-group-open:hover:border-quebi-line/40",
                  "outline-none focus-within:border-quebi-brand-mark focus-within:outline-none focus-within:ring-2 focus-within:ring-quebi-brand-mark focus-within:ring-offset-2 focus-within:ring-offset-quebi-bg",
                  "group-open:border-quebi-brand-mark group-open:ring-2 group-open:ring-quebi-brand-mark group-open:ring-offset-2 group-open:ring-offset-quebi-bg",
                  "invalid:border-red-500 focus-within:invalid:ring-red-500/50",
                  "in-disabled:cursor-not-allowed in-disabled:opacity-50",
                ],
            resolved,
          ),
        )}
        {...props}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className={cn(
              "inline shrink-0 rounded px-1 py-0.5 text-quebi-fg tracking-wider caret-transparent outline-0 type-literal:px-0",
              textSize,
              "data-placeholder:text-quebi-fg-subtle data-[type=literal]:text-quebi-fg-muted",
              "data-focused:bg-quebi-brand/20 data-focused:text-quebi-fg",
              "data-invalid:text-red-500 data-focused:data-invalid:bg-red-500/20 data-focused:data-invalid:text-red-500",
              "forced-colors:data-focused:bg-[Highlight] forced-colors:data-focused:text-[HighlightText]",
              "forced-color-adjust-none forced-colors:text-[ButtonText]",
              "in-disabled:opacity-50 disabled:opacity-50 forced-colors:disabled:text-[GrayText]",
            )}
          />
        )}
      </DateInputPrimitive>
    </span>
  )
}
