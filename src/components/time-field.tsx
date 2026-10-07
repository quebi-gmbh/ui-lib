"use client"

import type { DateInputProps, TimeFieldProps, TimeValue } from "react-aria-components"
import {
  composeRenderProps,
  DateInput as DateInputPrimitive,
  DateSegment,
  TimeField as TimeFieldPrimitive,
} from "react-aria-components"
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"

/**
 * TimeField — quebi design system
 *
 * Built on react-aria-components. A segmented time input (hour / minute /
 * second / AM-PM) drawn like `Input`: underline only, thickened on focus. The
 * segment being edited is filled with `action` ink; invalid turns the line and
 * the digits `danger`, and disabled dims the field.
 *
 * `shouldForceLeadingZeros` pads the hour segment to two digits — the same prop
 * `DateField` takes, doing the one thing a time has to pad. Under a locale
 * whose clock already pads it changes nothing (`de-DE` renders `09:05` either
 * way); under `en-US` it turns `9:05 AM` into `09:05 AM`.
 *
 * `TimeInput` takes the same `size` scale as `Input` and `DateInput`, and reads
 * `FieldSizeContext` when it is not given one — so a TimeField in an editable
 * table cell is the height of every other control in that row.
 */
export function TimeField<T extends TimeValue>({ className, ...props }: TimeFieldProps<T>) {
  return (
    <TimeFieldPrimitive
      {...props}
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        // The stack from the one place that owns it. `w-fit` after it, so a
        // bare TimeField is still as wide as its segments; the conform variant
        // puts `w-full` back on top, which is the footprint rule for a field.
        cn("group", fieldStyles, "w-fit", resolved),
      )}
    />
  )
}

/**
 * The padding half of the field size scale — the same three steps `Input` and
 * `DateInput` publish, so a time field and the button beside it are the same
 * height: `xs` is 30px and `sm` 38px, `md` is the default.
 * Spelled out here rather than imported from `date-field` so `TimeField` does
 * not gain a sibling component as a registry dependency for three strings; the
 * type size travels with it below, because a segmented field's height is its
 * segments' line box.
 */
const timeInputSizeStyles = {
  xs: "px-(--q-field-px) py-1.5",
  sm: "px-(--q-field-px) py-2",
  md: "px-(--q-field-px) py-2.5",
} as const

type TimeInputSize = keyof typeof timeInputSizeStyles

/** `bare` strips the field chrome (border, bg, rounding, focus ring, padding)
 *  so the TimeInput can be composed inside a wrapper that owns those. */
interface TimeInputProps extends Omit<DateInputProps, "children"> {
  bare?: boolean
  /**
   * Control height. Matches `Input`'s scale. Left out, it is whatever the
   * surrounding surface asked for — a table cell being the one that does. See
   * `@/lib/field-size`.
   */
  size?: TimeInputSize
}

export function TimeInput({ className, bare = false, size: sizeProp, ...props }: TimeInputProps) {
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
              ? [
                  "w-full border-0 bg-transparent outline-none",
                  timeInputSizeStyles[size],
                ]
              : [
                  // `Input`'s underline: a transparent top border keeps the scale's
                  // height; focus or an open picker thickens the line to 2px, no ring.
                  "quebi-field",
                  timeInputSizeStyles[size],
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
            // The segment carries no resting `text-*` of its own, by design. It
            // is `inline` inside the wrapper above, so font size, colour and
            // numeral width all inherit — which makes the wrapper the one place
            // that sets them, and a `text-[10.5px] text-quebi-fg-muted
            // tabular-nums` passed as `className` reaches the digits instead of
            // losing to a hardcoded `text-sm text-quebi-fg` here. `DaySchedule`
            // is why: its editable edge times have to match static labels drawn
            // at 10.5px, and even `size="xs"` is 12px. `tracking-wider` stays —
            // that is a segmented-field affordance, not a size. The variants
            // below still name a colour, because they are states rather than a
            // resting style, and a state has to outrank what was inherited.
            className={cn(
              "inline shrink-0 px-1 py-0.5 tracking-wider caret-transparent outline-0 type-literal:px-0",
              "data-placeholder:not-data-focused:text-quebi-fg-subtle",
              "focus:bg-quebi-action focus:text-quebi-on-action",
              "focus:data-invalid:bg-quebi-danger focus:data-invalid:text-quebi-on-action",
              "forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]",
              "forced-color-adjust-none forced-colors:text-[ButtonText]",
              "in-disabled:opacity-50 disabled:opacity-50 forced-colors:disabled:text-[GrayText]",
            )}
          />
        )}
      </DateInputPrimitive>
    </span>
  )
}
