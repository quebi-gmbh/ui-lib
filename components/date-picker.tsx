"use client"

import { CalendarDaysIcon } from "@heroicons/react/24/outline"
import type { DateDuration } from "@internationalized/date"
import type {
  DatePickerProps as DatePickerPrimitiveProps,
  DateValue,
  GroupProps,
  PopoverProps,
} from "react-aria-components"
import { Button, DatePicker as DatePickerPrimitive, Group } from "react-aria-components"
import { twJoin } from "tailwind-merge"
import { DateInput } from "@/components/ui/date-field"
import { fieldStyles } from "@/components/ui/field"
import { useIsMobile } from "@/hooks/use-mobile"
import { cx } from "@/lib/primitive"
import { Calendar } from "./calendar"
import { ModalContent } from "./modal"
import { PopoverContent } from "./popover"
import { RangeCalendar } from "./range-calendar"

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
      className={cx(fieldStyles({ className: "group" }), className)}
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
}

export function DatePickerOverlay({
  visibleDuration = { months: 1 },
  pageBehavior = "visible",
  placement = "bottom",
  range,
  ...props
}: DatePickerOverlayProps) {
  const isMobile = useIsMobile()

  return isMobile ? (
    <ModalContent aria-label="Date picker" closeButton={false}>
      <div className="flex justify-center p-6">
        {range ? (
          <RangeCalendar pageBehavior={pageBehavior} visibleDuration={visibleDuration} />
        ) : (
          <Calendar />
        )}
      </div>
    </ModalContent>
  ) : (
    <PopoverContent
      placement={placement}
      arrow={false}
      // min/max sized for a 7×36px grid plus gutter — calendar fits without
      // overflow after the spacing-override expanded Tailwind's default sizes.
      className={twJoin(
        "flex justify-center p-3",
        visibleDuration?.months === 1 ? "w-[304px] max-w-[304px]" : "max-w-none",
      )}
      {...props}
    >
      {range ? (
        <RangeCalendar pageBehavior={pageBehavior} visibleDuration={visibleDuration} />
      ) : (
        <Calendar />
      )}
    </PopoverContent>
  )
}

/**
 * DatePickerTrigger — Cellestial DS.
 *
 * DateInput on the left + calendar icon button on the right, styled as one
 * unified control (shared border, focus ring). Mirrors the NumberInput addon
 * pattern: the wrapper owns the outer border/ring, the inner DateInput drops
 * its own border + ring + rounding.
 */
export function DatePickerTrigger({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={cx(
        "group/dpt flex items-stretch w-full bg-surface rounded-sm border border-ink-200 overflow-hidden",
        "transition-[border-color,box-shadow] duration-[200ms]",
        "hover:border-ink-400",
        "focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100",
        className,
      )}
      {...props}
    >
      <div className="flex-1">
        <DateInput bare />
      </div>
      <Button
        data-slot="date-picker-trigger"
        className={twJoin(
          "inline-flex items-center px-3 bg-ink-50 text-ink-500 border-l border-ink-200 cursor-pointer",
          "transition-[border-color,color] duration-[200ms]",
          "group-hover/dpt:border-ink-400 hover:text-ink-700",
          "group-focus-within/dpt:border-brand-500",
          "outline-none focus-visible:outline-none",
        )}
      >
        <CalendarDaysIcon data-slot="icon" className="size-4" />
      </Button>
    </Group>
  )
}
