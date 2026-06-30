"use client"

import type { FieldMetadata } from "@conform-to/react"
import { type CalendarDate, parseDate } from "@internationalized/date"
import type { DateValue } from "react-aria-components"
import { DatePicker, type DatePickerProps, DatePickerTrigger } from "@/components/date-picker"
import { FieldError, Label } from "@/components/field"
import { cn } from "@/lib/utils"

interface ConformDatePickerProps
  extends Omit<
    DatePickerProps<DateValue>,
    "children" | "name" | "defaultValue" | "isRequired" | "isInvalid"
  > {
  // A date field from any form schema. The value type param is loose because the
  // wire value is an ISO string while react-aria works with DateValue objects;
  // only name/initialValue/required/errors are used here.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
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
 * Binds a date Conform field to the quebi DatePicker: derives name, required,
 * default, and validity from the field metadata and renders inline errors. The
 * control submits an ISO `YYYY-MM-DD` string via its hidden input.
 */
export function ConformDatePicker({ field, label, className, ...props }: ConformDatePickerProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <DatePicker
      {...props}
      name={field.name}
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
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </DatePicker>
  )
}
