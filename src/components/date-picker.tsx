"use client"

import type { DateDuration } from "@internationalized/date"
import { CalendarDays } from "lucide-react"
import { useEffect, useState } from "react"
import type {
  DatePickerProps as DatePickerPrimitiveProps,
  DateValue,
  GroupProps,
  PopoverProps,
} from "react-aria-components"
import {
  Button,
  composeRenderProps,
  DatePicker as DatePickerPrimitive,
  Group,
} from "react-aria-components"
import { Calendar, type CalendarHeaderVariant } from "@/components/calendar"
import { DateInput } from "@/components/date-field"
import { ModalContent } from "@/components/modal"
import { PopoverContent } from "@/components/popover"
import { RangeCalendar } from "@/components/range-calendar"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"

/**
 * Date Picker — quebi design system
 *
 * A segmented date input paired with a calendar overlay. The trigger uses the
 * underline of `Input`, with a calendar-icon button on the right; clicking it opens a Popover
 * holding the Calendar (or a Modal on mobile). Composes
 * @/components/{calendar,range-calendar,modal,popover,date-field}. Foundational
 * — the Conform date-picker / date-range-picker variants depend on it.
 *
 * The trigger's segments are a `DateInput`, so they format the way `DateField`
 * does: locale-derived, `30.6.2026` under `de-DE`. `shouldForceLeadingZeros`
 * pads the day and month to two digits (`30.06.2026`); the calendar overlay is
 * unaffected either way.
 */

const MOBILE_BREAKPOINT = 768

/** Inlined use-mobile hook: tracks whether the viewport is below md. */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

export interface DatePickerProps<T extends DateValue> extends DatePickerPrimitiveProps<T> {
  popover?: Omit<PopoverProps, "children">
}

export function DatePicker<T extends DateValue>({
  className,
  children,
  popover,
  ...props
}: DatePickerProps<T>) {
  return (
    <DatePickerPrimitive
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn("group", fieldStyles, resolved),
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function" ? children(values) : children}
          <DatePickerOverlay {...popover} />
        </>
      )}
    </DatePickerPrimitive>
  )
}

export interface DatePickerOverlayProps extends Omit<PopoverProps, "children"> {
  range?: boolean
  visibleDuration?: DateDuration
  pageBehavior?: "visible" | "single"
  /** Calendar header treatment — the in-body month picker (default) or chevron steppers. */
  variant?: CalendarHeaderVariant
}

export function DatePickerOverlay({
  visibleDuration = { months: 1 },
  pageBehavior = "visible",
  placement = "bottom",
  range,
  variant,
  ...props
}: DatePickerOverlayProps) {
  const isMobile = useIsMobile()

  return isMobile ? (
    <ModalContent aria-label="Date picker" closeButton={false}>
      <div className="flex justify-center p-6">
        {range ? (
          <RangeCalendar
            pageBehavior={pageBehavior}
            visibleDuration={visibleDuration}
            variant={variant}
          />
        ) : (
          <Calendar variant={variant} />
        )}
      </div>
    </ModalContent>
  ) : (
    <PopoverContent
      placement={placement}
      arrow={false}
      // min/max sized for a 7×36px grid plus gutter — the calendar fits without
      // overflow.
      className={cn(
        "flex justify-center p-3",
        visibleDuration?.months === 1 ? "w-[304px] max-w-[304px]" : "max-w-none",
      )}
      {...props}
    >
      {range ? (
        <RangeCalendar
          pageBehavior={pageBehavior}
          visibleDuration={visibleDuration}
          variant={variant}
        />
      ) : (
        <Calendar variant={variant} />
      )}
    </PopoverContent>
  )
}

/**
 * DatePickerTrigger — quebi design system
 *
 * DateInput on the left + calendar-icon button on the right, styled as one
 * control: one underline under both, owned by the wrapper. The inner
 * DateInput is rendered `bare` so it draws no line of its own.
 */
export function DatePickerTrigger({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn(
          // `Input`'s underline, under the segments and the calendar button
          // alike; focus anywhere inside, or the open calendar, thickens it.
          "group/dpt flex w-full items-stretch overflow-hidden bg-transparent",
          "quebi-field",
          "transition-[border-color,box-shadow] duration-150",
          "focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-focus)] group-open:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
          "data-invalid:border-b-quebi-danger data-invalid:focus-within:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
          resolved,
        ),
      )}
      {...props}
    >
      <div className="flex-1">
        <DateInput bare />
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
