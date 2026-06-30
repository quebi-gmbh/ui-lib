"use client"

import type { DateFieldProps, DateInputProps, DateValue } from "react-aria-components"
import {
  DateField as DateFieldPrimitive,
  DateInput as DateInputPrimitive,
  DateSegment,
} from "react-aria-components"
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

/** `bare` strips the input chrome (border, bg, rounding, focus ring, padding)
 *  so the DateInput can be composed inside a wrapper that owns those — e.g.
 *  a DatePickerTrigger which adds a calendar-icon button on the right. */
interface DateInputComponentProps extends Omit<DateInputProps, "children"> {
  bare?: boolean
}

export function DateInput({ className, bare = false, ...props }: DateInputComponentProps) {
  return (
    <span data-slot="control" className={bare ? "relative block w-full" : "relative block"}>
      <DateInputPrimitive
        className={cn(
          "relative block appearance-none text-sm text-white",
          bare
            ? "w-full rounded-none border-0 bg-transparent px-3 py-2.5 outline-none"
            : [
                // quebi input chrome — matches input.tsx.
                "rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02] px-3 py-2.5",
                "transition-[border-color,box-shadow] duration-200",
                "enabled:hover:border-cyan-500/40",
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
              "inline shrink-0 rounded px-1 py-0.5 text-sm text-white tracking-wider caret-transparent outline-0 type-literal:px-0",
              "data-placeholder:text-quebi-fg-subtle data-[type=literal]:text-quebi-fg-muted",
              "data-focused:bg-quebi-brand/20 data-focused:text-white",
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
