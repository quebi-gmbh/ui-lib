import { type FieldMetadata, getInputProps } from "@conform-to/react"
import { parseDate } from "@internationalized/date"
import { useMemo } from "react"
import type { DateValue } from "react-aria-components"
import { cn } from "../utils/cn"
import { DatePicker, type DatePickerProps, DatePickerTrigger } from "./date-picker"
import { FieldError, Label } from "./field"

interface ConformDatePickerProps
  extends Omit<DatePickerProps<DateValue>, "children" | "name" | "value" | "defaultValue"> {
  field: FieldMetadata<string>
  label?: string
}

export function ConformDatePicker({ field, label, ...pickerProps }: ConformDatePickerProps) {
  const hasErrors = !field.valid && field.errors
  const isRequired = field.required || false

  // Convert string value to DateValue for the DatePicker
  const dateValue = useMemo(() => {
    if (!field.defaultValue) return undefined
    try {
      return parseDate(field.defaultValue)
    } catch {
      return undefined
    }
  }, [field.defaultValue])

  // Get conform input props but override the onChange to handle DateValue
  const { value: _, ...inputProps } = getInputProps(field, { type: "date" })

  return (
    <DatePicker
      {...pickerProps}
      {...inputProps}
      defaultValue={dateValue}
      isRequired={isRequired}
      isInvalid={!!hasErrors}
      className={cn(hasErrors && "text-danger")}
    >
      {label && <Label>{label}</Label>}
      <DatePickerTrigger />
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </DatePicker>
  )
}
