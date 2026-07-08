"use client"

import { type FieldMetadata, getInputProps } from "@conform-to/react"
import type { NumberFieldProps } from "react-aria-components"
import { Description, FieldError, Label } from "@/components/field"
import { NumberField, NumberInput } from "@/components/number-field"

interface ConformNumberFieldProps
  extends Omit<NumberFieldProps, "name" | "value" | "defaultValue" | "onChange"> {
  // A numeric field: the wire value is a string that Conform coerces to a number,
  // so the metadata carries `number | string`. Only
  // name/default/required/errors are read off the metadata.
  field: FieldMetadata<number | string>
  label?: string
  description?: string
}

/**
 * ConformNumberField — NumberField wired to Conform.
 *
 * Binds a numeric Conform field to the quebi NumberField: derives name,
 * required, default, and validity from the field metadata, coerces the
 * string-typed field values into numbers, and renders inline errors.
 */
export function ConformNumberField({
  field,
  label,
  description,
  ...numberFieldProps
}: ConformNumberFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  const inputProps = getInputProps(field, { type: "number" })

  // NumberField expects numeric props, but Conform surfaces strings.
  const { step, ...otherInputProps } = inputProps
  const numberProps = {
    ...otherInputProps,
    defaultValue: otherInputProps.defaultValue
      ? Number.parseFloat(otherInputProps.defaultValue)
      : undefined,
    value: otherInputProps.value ? Number.parseFloat(otherInputProps.value) : undefined,
    step: step ? Number.parseFloat(step.toString()) : undefined,
  }

  return (
    <NumberField
      {...numberFieldProps}
      {...numberProps}
      isRequired={isRequired}
      isInvalid={hasErrors}
    >
      {label && <Label>{label}</Label>}
      <NumberInput />
      {description && <Description className="mt-1">{description}</Description>}
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </NumberField>
  )
}
