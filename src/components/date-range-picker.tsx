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
import { fieldStyles } from "@/components/field"

/**
 * Date Range Picker — quebi design system
 *
 * Two segmented date inputs (start → end) paired with a range-calendar overlay.
 * The trigger is drawn with `Input`'s underline, with a calendar-icon button on the right; clicking it
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
        cn("group", fieldStyles, resolved),
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
 * calendar-icon button on the right, read as one control: one underline under
 * all of it, owned by the wrapper. The inner DateInputs are rendered `bare`
 * so they draw no line of their own.
 */
export function DateRangePickerTrigger({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn(
          // `Input`'s underline, under the segments and the calendar button
          // alike; focus anywhere inside, or the open calendar, thickens it.
          "group/drpt flex w-full items-stretch overflow-hidden bg-transparent",
          "border-y border-t-transparent border-b-quebi-rule",
          "transition-[border-color,box-shadow] duration-150",
          "focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-focus)] group-open:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
          "data-invalid:border-b-quebi-danger data-invalid:focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
          resolved,
        ),
      )}
      {...props}
    >
      <div className="flex flex-1 items-center">
        <DateInput slot="start" bare className="w-fit pe-2" />
        <span aria-hidden="true" className="block h-px w-2 shrink-0 bg-quebi-fg-subtle" />
        <DateInput slot="end" bare className="w-fit px-2" />
      </div>
      <Button
        data-slot="date-picker-trigger"
        className={cn(
          "inline-flex cursor-pointer items-center bg-transparent ps-3 text-quebi-fg-subtle",
          "transition-colors duration-150 hover:text-quebi-fg",
          "outline-none focus-visible:text-quebi-fg focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset",
        )}
      >
        <CalendarDays data-slot="icon" className="size-4" />
      </Button>
    </Group>
  )
}
