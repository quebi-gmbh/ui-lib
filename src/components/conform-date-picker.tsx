"use client"

import type { FieldMetadata } from "@conform-to/react"
import { type CalendarDate, parseDate } from "@internationalized/date"
import type { DateValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { DatePicker, type DatePickerProps, DatePickerTrigger } from "@/components/date-picker"
import { Description, FieldError, Label } from "@/components/field"

export interface ConformDatePickerProps
  extends Omit<
    DatePickerProps<DateValue>,
    "children" | "name" | "form" | "value" | "defaultValue" | "isRequired" | "isInvalid"
  > {
  /**
   * A date field: the wire value is an ISO `YYYY-MM-DD` string that Conform
   * coerces to a Date, so the metadata carries `Date | string`.
   */
  field: FieldMetadata<Date | string>
  label?: string
  description?: string
}

/** Parse a Conform field's string default (ISO `YYYY-MM-DD`) into a CalendarDate.
 *  Returns undefined for empty/invalid values so the field starts blank. */
function toDefaultValue(value: unknown): CalendarDate | undefined {
  if (typeof value !== "string" || value === "") return undefined
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

/**
 * ConformDatePicker — DatePicker wired to Conform.
 *
 * Binds a date Conform field to the quebi DatePicker: derives name, id, form,
 * required, default, and validity from the field metadata and renders inline
 * errors. The control submits an ISO `YYYY-MM-DD` string via the hidden input
 * react-aria renders for it.
 */
export function ConformDatePicker({
  field,
  label,
  description,
  className,
  ...props
}: ConformDatePickerProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <DatePicker
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultValue={toDefaultValue(field.initialValue)}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn("w-full", className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <DatePickerTrigger />
      {/* No ids on these two: the react-aria field generates its own for the
          description and error slots and already points the control at them. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </DatePicker>
  )
}
