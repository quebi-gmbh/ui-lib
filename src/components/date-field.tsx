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
import { fieldStyles } from "@/components/field"

/**
 * DateField — quebi design system
 *
 * Built on react-aria-components. A segmented date entry control: each part
 * (day / month / year) is an individually editable segment. The wrapper is
 * drawn like `Input` — underline only, thickened on focus; the focused segment
 * is filled with `action` ink, the library's mark for "this one".
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
        cn("group", fieldStyles, "w-fit", resolved),
      )}
    />
  )
}

/**
 * The padding half of the field size scale — the same three steps `Input`
 * publishes, so a date field and the button beside it are the same height:
 * `xs` is 30px and `sm` 38px, `md` is the default. No horizontal padding,
 * as in `Input`. Spelled out
 * here rather than imported so `DateField` does not gain `Input` as a registry
 * dependency for three strings; the type size travels with it below, because a
 * segmented field's height is its segments' line box.
 */
const dateInputSizeStyles = {
  xs: "px-0 py-1.5",
  sm: "px-0 py-2",
  md: "px-0 py-2.5",
} as const

type DateInputSize = keyof typeof dateInputSizeStyles

/** `bare` strips the input chrome (underline, focus treatment)
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
              ? ["w-full border-0 bg-transparent outline-none", dateInputSizeStyles[size]]
              : [
                  // `Input`'s underline: a transparent top border keeps the scale's
                  // height; focus or an open picker thickens the line to 2px, no ring.
                  "border-y border-t-transparent border-b-quebi-rule bg-transparent",
                  dateInputSizeStyles[size],
                  "transition-[border-color,box-shadow] duration-150",
                  "outline-none focus-within:outline-none focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
                  "group-open:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
                  "data-invalid:border-b-quebi-danger focus-within:data-invalid:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
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
              "inline shrink-0 px-1 py-0.5 text-quebi-fg tracking-wider caret-transparent outline-0 type-literal:px-0",
              textSize,
              "data-placeholder:text-quebi-fg-subtle data-[type=literal]:text-quebi-fg-muted",
              "data-focused:bg-quebi-action data-focused:text-quebi-on-action",
              "data-invalid:text-quebi-danger data-focused:data-invalid:bg-quebi-danger data-focused:data-invalid:text-quebi-on-action",
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
