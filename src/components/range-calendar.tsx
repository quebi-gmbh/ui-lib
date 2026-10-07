"use client"

import { getLocalTimeZone, today } from "@internationalized/date"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  type DateValue,
  RangeCalendar as RangeCalendarPrimitive,
  type RangeCalendarProps as RangeCalendarPrimitiveProps,
} from "react-aria-components"
import {
  CalendarBody,
  CalendarBodyModeProvider,
  CalendarGridHeader,
  CalendarHeader,
  type CalendarHeaderVariant,
} from "@/components/calendar"
import { cn } from "@/lib/utils"

/**
 * Range Calendar — quebi design system
 *
 * An accessible date-range calendar built on react-aria-components and
 * @internationalized/date. The range endpoints take the signal fill, the days
 * in-between the selected ground, and today is underlined. Composes the shared header, body and grid header
 * from the Calendar component — including its `variant`, so the month/year
 * control swaps the Month Picker into this calendar's body exactly as it does
 * in a single-month one, and the chevron-stepper header is available too.
 * Foundational — Date Picker and Date Range Picker depend on it.
 */

interface RangeCalendarProps<T extends DateValue> extends RangeCalendarPrimitiveProps<T> {
  /** Header treatment — the in-body month picker (default) or chevron steppers. */
  variant?: CalendarHeaderVariant
}

function RangeCalendar<T extends DateValue>({
  className,
  visibleDuration = { months: 1 },
  variant,
  ...props
}: RangeCalendarProps<T>) {
  const now = today(getLocalTimeZone())
  return (
    /* `w-fit` for the reason `Calendar` carries it — see the note there. */
    <RangeCalendarPrimitive
      data-slot="calendar"
      className="w-fit"
      visibleDuration={visibleDuration}
      {...props}
    >
      <CalendarBodyModeProvider>
        <CalendarHeader variant={variant} />
        <CalendarBody>
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
                          "group/calendar-cell relative size-9 shrink-0 cursor-default text-sm text-quebi-fg outline-hidden",
                          // the whole span sits on the selected ground, its
                          // ends rounded; the endpoints paint signal over it
                          "selected:bg-quebi-selected selected:text-quebi-on-selected",
                          "data-selection-start:rounded-s-(--q-radius-control) data-selection-end:rounded-e-(--q-radius-control)",
                          "data-outside-month:text-quebi-fg-subtle",
                        )}
                      >
                        {({
                          formattedDate,
                          isSelected,
                          isSelectionStart,
                          isSelectionEnd,
                          isDisabled,
                          isUnavailable,
                          isFocusVisible,
                        }) => (
                          <span
                            className={cn(
                              "flex size-full items-center justify-center rounded-(--q-radius-control) tabular-nums transition-colors duration-150",
                              isSelected && (isSelectionStart || isSelectionEnd)
                                ? "bg-quebi-signal text-quebi-on-signal"
                                : isSelected
                                  ? "group-hover/calendar-cell:bg-quebi-signal/15"
                                  : "group-hover/calendar-cell:bg-quebi-raised",
                              // today: an underline, in whichever ink the cell is
                              date.compare(now) === 0 &&
                                "font-medium underline decoration-1 underline-offset-4",
                              isDisabled && "text-quebi-fg-subtle",
                              isUnavailable && "text-quebi-fg-subtle line-through",
                              isFocusVisible && "ring-2 ring-quebi-focus ring-inset",
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
        </CalendarBody>
      </CalendarBodyModeProvider>
    </RangeCalendarPrimitive>
  )
}

export type { RangeCalendarProps }
export { RangeCalendar }
