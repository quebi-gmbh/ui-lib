"use client"

import type { FieldMetadata } from "@conform-to/react"
import { type CalendarDate, parseDate } from "@internationalized/date"
import type { DateFieldProps, DateValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { DateField, DateInput } from "@/components/date-field"
import { FieldError, Label } from "@/components/field"

interface ConformDateFieldProps
  extends Omit<DateFieldProps<DateValue>, "name" | "defaultValue" | "isRequired" | "isInvalid"> {
  // A date field from any form schema. The value type param is loose because the
  // wire value is an ISO string while react-aria works with DateValue objects;
  // only name/initialValue/required/errors/id are used here.
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
 * ConformDateField — DateField wired to Conform.
 *
 * Binds a date Conform field to the quebi segmented DateField: derives name,
 * required, default, and validity from the field metadata and renders inline
 * errors. The control submits an ISO `YYYY-MM-DD` string via its hidden input.
 */
export function ConformDateField({ field, label, className, ...props }: ConformDateFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <DateField
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
      <DateInput />
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </DateField>
  )
}
