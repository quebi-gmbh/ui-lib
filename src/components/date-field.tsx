"use client"

import type { DateFieldProps, DateInputProps, DateValue } from "react-aria-components"
import {
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
 */
export function DateField<T extends DateValue>({ className, ...props }: DateFieldProps<T>) {
  return (
    <DateFieldPrimitive
      {...props}
      data-slot="control"
      className={cn("group flex w-fit flex-col gap-1", className)}
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
        className={cn(
          "relative block appearance-none text-quebi-fg",
          textSize,
          bare
            ? ["w-full rounded-none border-0 bg-transparent outline-none", dateInputSizeStyles[size]]
            : [
                // quebi input chrome — matches input.tsx.
                "rounded-quebi-sm border border-quebi-line/20 bg-quebi-surface/[0.02]",
                dateInputSizeStyles[size],
                "transition-[border-color,box-shadow] duration-200",
                "enabled:hover:border-quebi-line/40",
                "outline-none focus-within:border-quebi-brand focus-within:outline-none focus-within:ring-2 focus-within:ring-quebi-brand/50",
                "group-open:border-quebi-brand group-open:ring-2 group-open:ring-quebi-brand/50",
                "invalid:border-red-500 focus-within:invalid:ring-red-500/50",
                "in-disabled:cursor-not-allowed in-disabled:opacity-50",
              ],
          className,
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
