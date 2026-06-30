"use client"

import type { DateDuration } from "@internationalized/date"
import { CalendarDays } from "lucide-react"
import {
  Button,
  DateRangePicker as DateRangePickerPrimitive,
  type DateRangePickerProps as DateRangePickerPrimitiveProps,
  type DateValue,
  Group,
  type GroupProps,
  type PopoverProps,
} from "react-aria-components"
import { DateInput } from "@/components/date-field"
import { DatePickerOverlay } from "@/components/date-picker"
import { cn } from "@/lib/utils"

/**
 * Date Range Picker — quebi design system
 *
 * Two segmented date inputs (start → end) paired with a range-calendar overlay.
 * The trigger uses the quebi input chrome (translucent fill, cyan-tinted border,
 * brand-teal focus ring) with a calendar-icon button on the right; clicking it
 * opens a Popover (or Modal on mobile) holding the RangeCalendar. Composes
 * @/components/{date-picker,date-field,field}. The Conform date-range-picker
 * variant depends on it.
 */

export interface DateRangePickerProps<T extends DateValue>
  extends DateRangePickerPrimitiveProps<T> {
  visibleDuration?: DateDuration
  pageBehavior?: "visible" | "single"
  popover?: Omit<PopoverProps, "children">
}

export function DateRangePicker<T extends DateValue>({
  className,
  popover,
  children,
  visibleDuration = { months: 1 },
  pageBehavior = "visible",
  ...props
}: DateRangePickerProps<T>) {
  return (
    <DateRangePickerPrimitive
      data-slot="control"
      className={cn("group flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function" ? children(values) : children}
          <DatePickerOverlay
            {...popover}
            range
            visibleDuration={visibleDuration}
            pageBehavior={pageBehavior}
          />
        </>
      )}
    </DateRangePickerPrimitive>
  )
}

/**
 * DateRangePickerTrigger — quebi design system
 *
 * A start DateInput, a separator dash, and an end DateInput on the left, plus a
 * calendar-icon button on the right, styled as one unified control (shared
 * cyan-tinted border, brand-teal focus ring). The wrapper owns the outer
 * border/ring; the inner DateInputs are rendered `bare` so they drop their own
 * border + ring + rounding.
 */
export function DateRangePickerTrigger({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={cn(
        "group/drpt flex w-full items-stretch overflow-hidden rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02]",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-cyan-500/40",
        "focus-within:border-quebi-brand focus-within:ring-2 focus-within:ring-quebi-brand/50",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 items-center">
        <DateInput slot="start" bare className="w-fit px-3" />
        <span
          aria-hidden="true"
          className="block h-0.5 w-2 shrink-0 rounded-full bg-quebi-fg-muted"
        />
        <DateInput slot="end" bare className="w-fit px-3" />
      </div>
      <Button
        data-slot="date-picker-trigger"
        className={cn(
          "inline-flex cursor-pointer items-center border-cyan-500/20 border-l bg-white/[0.02] px-3 text-quebi-fg-muted",
          "transition-[border-color,color] duration-200",
          "group-hover/drpt:border-cyan-500/40 hover:text-white",
          "group-focus-within/drpt:border-quebi-brand",
          "outline-none focus-visible:outline-none",
        )}
      >
        <CalendarDays data-slot="icon" className="size-4" />
      </Button>
    </Group>
  )
}
