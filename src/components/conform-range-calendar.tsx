"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { type CalendarDate, parseDate } from "@internationalized/date"
import type { DateValue, RangeCalendarProps, RangeValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"
import { RangeCalendar } from "@/components/range-calendar"

/** The wire shape: two ISO `YYYY-MM-DD` strings, submitted as `<name>.start` / `<name>.end`. */
export interface ConformCalendarRange {
  start: string
  end: string
}

export interface ConformRangeCalendarProps
  extends Omit<
    RangeCalendarProps<DateValue>,
    "value" | "defaultValue" | "onChange" | "isInvalid" | "children"
  > {
  /**
   * A date range bound to an object form value with `start` and `end` ISO
   * strings. Validate it with `v.object({ start: …, end: … })`.
   */
  field: FieldMetadata<ConformCalendarRange>
  label?: string
  description?: string
}

/** Parse an ISO `YYYY-MM-DD` string into a CalendarDate; null for empty/invalid. */
function toCalendarDate(value: unknown): CalendarDate | null {
  if (typeof value !== "string" || value === "") return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/** Read the control payload as a calendar range, or null while it is incomplete. */
function toRangeValue(
  payload: ConformCalendarRange | null | undefined,
): RangeValue<DateValue> | null {
  const start = toCalendarDate(payload?.start)
  const end = toCalendarDate(payload?.end)
  return start && end ? { start, end } : null
}

/**
 * ConformRangeCalendar — an always-visible RangeCalendar wired to Conform.
 *
 * Binds a start/end Conform field through a registered hidden `<fieldset>`,
 * which renders one hidden input per part: `<name>.start` and `<name>.end`,
 * both ISO `YYYY-MM-DD`. react-aria's RangeCalendar has no `name` and renders
 * no form control, so the fieldset is the whole form value.
 *
 * Reach for `conform-date-range-picker` unless the calendar has to stay on
 * screen.
 */
export function ConformRangeCalendar({
  field,
  label,
  description,
  className,
  ...props
}: ConformRangeCalendarProps) {
  const control = useControl<ConformCalendarRange, ConformCalendarRange>({
    defaultValue: (field.initialValue as ConformCalendarRange | undefined) ?? undefined,
    parse: (payload) => {
      if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null
      const { start, end } = payload as Record<string, unknown>
      return {
        start: typeof start === "string" ? start : "",
        end: typeof end === "string" ? end : "",
      }
    },
  })

  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex w-fit flex-col gap-1.5", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}

      <BaseControl
        type="fieldset"
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue}
      />

      <RangeCalendar
        {...props}
        value={toRangeValue(control.payload)}
        onChange={(range) =>
          control.change(
            range ? { start: range.start.toString(), end: range.end.toString() } : null,
          )
        }
        isInvalid={hasErrors}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      />

      {/* These ids are ours to set: the control below is not a react-aria
          field, so nothing generates them and nothing else points at them.
          The aria-describedby above is the only reference they get. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
