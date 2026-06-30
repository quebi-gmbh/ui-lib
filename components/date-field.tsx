import type { DateFieldProps, DateInputProps, DateValue } from "react-aria-components"

import {
  DateField as DateFieldPrimitive,
  DateInput as DateInputPrimitive,
  DateSegment,
} from "react-aria-components"
import { twJoin } from "tailwind-merge"
import { cx } from "@/lib/primitive"
import { fieldStyles } from "./field"

export function DateField<T extends DateValue>({ className, ...props }: DateFieldProps<T>) {
  return (
    <DateFieldPrimitive
      {...props}
      data-slot="control"
      className={cx(fieldStyles({ className: "w-fit" }), className)}
    />
  )
}

/** `bare` strips the input chrome (border, bg, rounding, focus ring, padding)
 *  so the DateInput can be composed inside a wrapper that owns those — e.g.
 *  DatePickerTrigger which adds a calendar-icon button on the right. */
interface DateInputCellestialProps extends Omit<DateInputProps, "children"> {
  bare?: boolean
}

export function DateInput({ className, bare = false, ...props }: DateInputCellestialProps) {
  return (
    <span data-slot="control" className={bare ? "relative block w-full" : "relative block"}>
      <DateInputPrimitive
        className={cx(
          "relative block appearance-none font-body! text-[14px]! leading-[17px]! text-ink-900!",
          bare
            ? "w-full bg-transparent border-0 rounded-none px-3 py-2.5 outline-none"
            : [
                // Cellestial DS — matches .input styling from input.tsx.
                "bg-surface border border-ink-200 rounded-sm px-3 py-2.5",
                "transition-[border-color,box-shadow] duration-[200ms]",
                "enabled:hover:border-ink-400",
                "focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 focus-within:outline-none",
                "group-open:border-brand-500 group-open:ring-4 group-open:ring-brand-100",
                "invalid:border-danger-500 focus-within:invalid:ring-danger-100",
                "in-disabled:bg-ink-50 in-disabled:text-ink-400",
              ],
          className,
        )}
        {...props}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className={twJoin(
              // text-[14px] leading-[17px] keeps the segment line box on the
              // same 17px track as the parent DateInput — without it the
              // browser default ~20px line-height pushes the whole field to
              // 42px, breaking parity with Input/Select at 39px.
              "inline shrink-0 rounded px-1 type-literal:px-0 py-0.5 text-[14px] leading-[17px] text-fg tracking-wider caret-transparent outline-0 data-placeholder:not-data-focused:text-muted-fg",
              "focus:bg-primary-subtle focus:text-primary-subtle-fg focus:data-invalid:bg-danger-subtle focus:data-invalid:text-danger-subtle-fg forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]",
              "forced-color-adjust-none forced-colors:text-[ButtonText]",
              "in-disabled:bg-muted disabled:bg-muted forced-colors:disabled:text-[GrayText]",
            )}
          />
        )}
      </DateInputPrimitive>
    </span>
  )
}
