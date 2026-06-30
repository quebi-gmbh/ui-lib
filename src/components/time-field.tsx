"use client"

import type { DateInputProps, TimeFieldProps, TimeValue } from "react-aria-components"
import {
  DateInput as DateInputPrimitive,
  DateSegment,
  TimeField as TimeFieldPrimitive,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * TimeField — quebi design system
 *
 * Built on react-aria-components. A segmented time input (hour / minute /
 * second / AM-PM) styled to match the quebi Input: a translucent field with a
 * cyan-tinted border that lifts to brand teal on focus, plus the quebi teal
 * ring. Each segment highlights with the brand tint while editing; invalid
 * uses red and disabled dims the field.
 */
export function TimeField<T extends TimeValue>({ className, ...props }: TimeFieldProps<T>) {
  return (
    <TimeFieldPrimitive
      {...props}
      data-slot="control"
      className={cn(
        "group w-fit",
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

/** `bare` strips the field chrome (border, bg, rounding, focus ring, padding)
 *  so the TimeInput can be composed inside a wrapper that owns those. */
interface TimeInputProps extends Omit<DateInputProps, "children"> {
  bare?: boolean
}

export function TimeInput({ className, bare = false, ...props }: TimeInputProps) {
  return (
    <span data-slot="control" className={bare ? "relative block w-full" : "relative block"}>
      <DateInputPrimitive
        className={cn(
          "relative block appearance-none text-sm text-white",
          bare
            ? "w-full rounded-none border-0 bg-transparent px-3 py-2.5 outline-none"
            : [
                // matches the quebi Input chrome.
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
              "inline shrink-0 rounded px-1 py-0.5 text-sm tracking-wider text-white caret-transparent outline-0 type-literal:px-0",
              "data-placeholder:not-data-focused:text-quebi-fg-subtle",
              "focus:bg-quebi-brand/20 focus:text-white",
              "focus:data-invalid:bg-red-500/20 focus:data-invalid:text-red-400",
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
