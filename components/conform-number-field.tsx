import { type FieldMetadata, getInputProps } from "@conform-to/react"
import type { NumberFieldProps } from "react-aria-components"
import { Description, FieldError, Label } from "./field"
import { NumberField, NumberInput } from "./number-field"

interface ConformNumberFieldProps
  extends Omit<NumberFieldProps, "name" | "value" | "defaultValue" | "onChange"> {
  field: FieldMetadata<number | string>
  label?: string
  description?: string
}

export function ConformNumberField({
  field,
  label,
  description,
  ...numberFieldProps
}: ConformNumberFieldProps) {
  const hasErrors = !field.valid && field.errors
  const isRequired = field.required || false

  const inputProps = getInputProps(field, { type: "number" })

  // Convert string values to numbers for NumberField
  const { step, ...otherInputProps } = inputProps
  const numberProps = {
    ...otherInputProps,
    defaultValue: otherInputProps.defaultValue
      ? parseFloat(otherInputProps.defaultValue)
      : undefined,
    value: otherInputProps.value ? parseFloat(otherInputProps.value) : undefined,
    step: step ? parseFloat(step.toString()) : undefined,
  }

  return (
    <NumberField
      {...numberFieldProps}
      {...numberProps}
      isRequired={isRequired}
      isInvalid={!!hasErrors}
    >
      {label && <Label>{label}</Label>}
      <NumberInput />
      {description && <Description className="mt-1">{description}</Description>}
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </NumberField>
  )
}
