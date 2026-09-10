"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { type CalendarDate, parseDate } from "@internationalized/date"
import type { CalendarProps, DateValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/calendar"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"

export interface ConformCalendarProps
  extends Omit<
    CalendarProps<DateValue>,
    "value" | "defaultValue" | "onChange" | "isInvalid" | "className"
  > {
  /** A date bound to a string form value — ISO `YYYY-MM-DD`. */
  field: FieldMetadata<Date | string>
  label?: string
  description?: string
  className?: string
}

/** Parse the wire value (ISO `YYYY-MM-DD`) into a CalendarDate; null for empty/invalid. */
function toCalendarDate(value: string | undefined): CalendarDate | null {
  if (!value) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/**
 * ConformCalendar — an always-visible Calendar wired to Conform.
 *
 * Binds a date Conform field to the quebi Calendar through a registered hidden
 * input carrying an ISO `YYYY-MM-DD` string. react-aria's Calendar has no
 * `name` and renders no form control — it is a picker, not a field — so the
 * hidden input is the whole form value.
 *
 * Reach for `conform-date-picker` unless the calendar has to stay on screen;
 * the popover variant is the common case and needs no custom control.
 *
 * `BaseControl` renders the input with the `hidden` attribute and no React
 * `value` prop; both matter, see `conform-time-field`.
 */
export function ConformCalendar({
  field,
  label,
  description,
  className,
  ...props
}: ConformCalendarProps) {
  const control = useControl({ defaultValue: (field.initialValue as string) ?? "" })
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
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue ?? ""}
      />

      <Calendar
        {...props}
        value={toCalendarDate(control.value)}
        onChange={(value) => control.change(value ? value.toString() : "")}
        isInvalid={hasErrors}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      />

      {/* These ids are ours to set: react-aria only owns the ids of children
          rendered inside its field, and these are siblings of the calendar
          above, not children of it. The aria-describedby above is the only
          reference they get. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
