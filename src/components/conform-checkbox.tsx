"use client"

import { type FieldMetadata, getInputProps } from "@conform-to/react"
import type { CheckboxProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/checkbox"

interface ConformCheckboxProps extends Omit<CheckboxProps, "name" | "defaultSelected"> {
  // A boolean-ish field from any form schema. The value type param is loose
  // because checkbox fields surface as boolean | "on" depending on the schema
  // (e.g. zod preprocess); only name/defaultChecked/required/errors are used.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
}

/**
 * ConformCheckbox — Checkbox wired to Conform.
 *
 * Binds a boolean Conform field to the quebi Checkbox: derives name, required,
 * default, and validity from the field metadata and renders inline errors.
 */
export function ConformCheckbox({ field, label, className, ...props }: ConformCheckboxProps) {
  const hasErrors = !field.valid && !!field.errors
  const inputProps = getInputProps(field, { type: "checkbox" })

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        {...props}
        {...inputProps}
        defaultSelected={field.defaultChecked}
        isRequired={field.required ?? false}
        isInvalid={hasErrors}
        className={cn(className)}
      >
        {label}
      </Checkbox>
      {hasErrors && <p className="text-sm text-red-500">{field.errors?.join(", ")}</p>}
    </div>
  )
}
