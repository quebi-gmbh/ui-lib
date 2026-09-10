"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { type CalendarDate, parseDate } from "@internationalized/date"
import { useRef } from "react"
import type { DateValue, RangeValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import {
  DateRangePicker,
  type DateRangePickerProps,
  DateRangePickerTrigger,
} from "@/components/date-range-picker"
import { Description, FieldError, focusFirstControl, Label } from "@/components/field"

/** The wire shape: two ISO `YYYY-MM-DD` strings, submitted as `<name>.start` / `<name>.end`. */
export interface ConformDateRange {
  start: string
  end: string
}

export interface ConformDateRangePickerProps
  extends Omit<
    DateRangePickerProps<DateValue>,
    "children" | "name" | "value" | "defaultValue" | "onChange" | "isRequired" | "isInvalid"
  > {
  /**
   * A date range bound to an object form value with `start` and `end` ISO
   * strings. Validate it with `v.object({ start: …, end: … })`.
   */
  field: FieldMetadata<ConformDateRange>
  label?: string
  description?: string
}

/** Parse an ISO `YYYY-MM-DD` string into a CalendarDate; undefined for empty/invalid. */
function toCalendarDate(value: unknown): CalendarDate | null {
  if (typeof value !== "string" || value === "") return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/** Read the control payload as a calendar range, or null while it is incomplete. */
function toRangeValue(payload: ConformDateRange | null | undefined): RangeValue<DateValue> | null {
  const start = toCalendarDate(payload?.start)
  const end = toCalendarDate(payload?.end)
  return start && end ? { start, end } : null
}

/**
 * ConformDateRangePicker — DateRangePicker wired to Conform.
 *
 * Binds a start/end Conform field to the quebi DateRangePicker through a
 * registered hidden `<fieldset>`, which renders one hidden input per part:
 * `<name>.start` and `<name>.end`, both ISO `YYYY-MM-DD`.
 *
 * The fieldset is not a stylistic choice. `DateRangePickerProps` is
 * `Omit<InputDOMProps, "name">` — the control takes no name at all, and
 * react-aria renders no hidden inputs for it, so a range picker submits nothing
 * on its own. The `startName`/`endName` in the stately types are not wired up
 * either.
 *
 * The registered fieldset is hidden by CSS rather than by the `hidden`
 * attribute, and carries no React `value` prop; both are silent when broken —
 * see `conform-time-field` for what each failure looks like.
 *
 * One gap stays: Conform v1 only focuses `input`/`select`/`textarea`, so an
 * error reported against `<name>` itself ("the end date has to come after the
 * start") reaches no element at all, while an error against `<name>.start` or
 * `<name>.end` reaches the matching hidden input inside the fieldset and is
 * forwarded from there.
 */
export function ConformDateRangePicker({
  field,
  label,
  description,
  className,
  ...props
}: ConformDateRangePickerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const control = useControl<ConformDateRange, ConformDateRange>({
    defaultValue: (field.initialValue as ConformDateRange | undefined) ?? undefined,
    parse: (payload) => {
      if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null
      const { start, end } = payload as Record<string, unknown>
      return {
        start: typeof start === "string" ? start : "",
        end: typeof end === "string" ? end : "",
      }
    },
    // Conform focuses the first errored field after a failed submit; that is
    // the registered fieldset, which nobody can see — hand it to the segments.
    onFocus() {
      focusFirstControl(triggerRef.current)
    },
  })

  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <DateRangePicker
      {...props}
      value={toRangeValue(control.payload)}
      onChange={(range) =>
        control.change(
          range ? { start: range.start.toString(), end: range.end.toString() } : null,
        )
      }
      onBlur={() => control.blur()}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn("w-full", className)}
    >
      <BaseControl
        type="fieldset"
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue}
        hidden={false}
        tabIndex={-1}
        className="sr-only"
      />
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <div ref={triggerRef}>
        <DateRangePickerTrigger />
      </div>
      {/* No ids on these two, and no aria-describedby above: the react-aria
          field generates its own ids for the description and error slots and
          already points the control at them. Setting id={field.errorId} here
          would replace the id the control references, and the message would
          stop being announced — verified, it fails silently. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </DateRangePicker>
  )
}
