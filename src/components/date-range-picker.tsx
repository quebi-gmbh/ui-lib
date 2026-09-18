"use client"

import type { DateDuration } from "@internationalized/date"
import { CalendarDays } from "lucide-react"
import {
  Button,
  composeRenderProps,
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
 *
 * Both halves are `DateInput`s, so both format the way `DateField` does:
 * locale-derived, `30.6.2026` under `de-DE`. `shouldForceLeadingZeros` pads the
 * day and month of start *and* end to two digits (`30.06.2026`) — it is one
 * prop on the range, not one per input.
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
      className={composeRenderProps(className, (resolved) =>
        cn("group flex w-full flex-col gap-1.5", resolved),
      )}
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
      className={composeRenderProps(className, (resolved) =>
        cn(
          "group/drpt flex w-full items-stretch overflow-hidden rounded-quebi-sm border border-quebi-line/20 bg-quebi-surface/[0.02]",
          "transition-[border-color,box-shadow] duration-200",
          // Unguarded this *beat* the focus border below: both are (0,2,0) and
          // Tailwind emits `focus-within` before `hover`, so pointing at a focused
          // picker dropped the mark-teal border and left the ring floating off it.
          "not-focus-within:hover:border-quebi-line/40",
          "focus-within:border-quebi-brand-mark focus-within:ring-2 focus-within:ring-quebi-brand-mark focus-within:ring-offset-2 focus-within:ring-offset-quebi-bg",
          resolved,
        ),
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
          "inline-flex cursor-pointer items-center border-quebi-line/20 border-l bg-quebi-surface/[0.02] px-3 text-quebi-fg-muted",
          "transition-[border-color,color] duration-200",
          // Guarded for the same reason as the wrapper border: this divider and
          // that border are one edge, so they have to change together or the
          // control reads as two.
          "group-not-focus-within/drpt:group-hover/drpt:border-quebi-line/40 hover:text-quebi-fg",
          "group-focus-within/drpt:border-quebi-brand-mark",
          "outline-none focus-visible:outline-none",
        )}
      >
        <CalendarDays data-slot="icon" className="size-4" />
      </Button>
    </Group>
  )
}
