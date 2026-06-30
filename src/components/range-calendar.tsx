"use client"

import { getLocalTimeZone, today } from "@internationalized/date"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  type DateValue,
  RangeCalendar as RangeCalendarPrimitive,
  type RangeCalendarProps,
} from "react-aria-components"
import { CalendarGridHeader, CalendarHeader } from "@/components/calendar"
import { cn } from "@/lib/utils"

/**
 * Range Calendar — quebi design system
 *
 * An accessible date-range calendar built on react-aria-components and
 * @internationalized/date. Restyled to quebi tokens: the range endpoints fill
 * with brand teal, the days in-between get a faint brand wash, and today is
 * marked with a brand dot. Composes the shared header and grid header from the
 * Calendar component. Foundational — Date Picker and Date Range Picker depend
 * on it.
 */

function RangeCalendar<T extends DateValue>({
  className,
  visibleDuration = { months: 1 },
  ...props
}: RangeCalendarProps<T>) {
  const now = today(getLocalTimeZone())
  return (
    <RangeCalendarPrimitive data-slot="calendar" visibleDuration={visibleDuration} {...props}>
      <CalendarHeader isRange />
      <div className="flex snap-x items-start justify-stretch gap-6 overflow-auto sm:gap-10">
        {Array.from({ length: visibleDuration?.months ?? 1 }).map((_, index) => {
          const id = index + 1
          return (
            <CalendarGrid
              // biome-ignore lint/suspicious/noArrayIndexKey: stable array derived from visibleDuration
              key={index}
              offset={id >= 2 ? { months: id - 1 } : undefined}
              className="[&_td]:border-collapse [&_td]:px-0 [&_td]:py-0.5"
            >
              <CalendarGridHeader />
              <CalendarGridBody className="snap-start">
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={cn(
                      "group/calendar-cell relative size-9 shrink-0 cursor-default text-sm text-white outline-hidden",
                      // in-between (selected, not an endpoint) days get a faint brand wash
                      "selected:bg-quebi-brand/15",
                      // round the range ends
                      "selection-start:rounded-s-quebi-sm data-selection-end:rounded-e-quebi-sm",
                      "data-outside-month:text-quebi-fg-subtle",
                    )}
                  >
                    {({ formattedDate, isSelected, isSelectionStart, isSelectionEnd, isDisabled }) => (
                      <span
                        className={cn(
                          "flex size-full items-center justify-center rounded-quebi-sm tabular-nums transition-colors",
                          isSelected && (isSelectionStart || isSelectionEnd)
                            ? // endpoints: solid brand teal on quebi background
                              "bg-quebi-brand text-quebi-bg hover:bg-quebi-brand-hover"
                            : isSelected
                              ? // in-between days: faint brand wash, darker on hover
                                "group-hover/calendar-cell:bg-quebi-brand/25"
                              : // unselected days: faint white wash on hover
                                "group-hover/calendar-cell:bg-white/[0.04]",
                          // today marker dot
                          date.compare(now) === 0 &&
                            !(isSelected && (isSelectionStart || isSelectionEnd)) &&
                            "relative after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-quebi-brand",
                          isDisabled && "text-quebi-fg-subtle",
                        )}
                      >
                        {formattedDate}
                      </span>
                    )}
                  </CalendarCell>
                )}
              </CalendarGridBody>
            </CalendarGrid>
          )
        })}
      </div>
    </RangeCalendarPrimitive>
  )
}

export { RangeCalendar }
