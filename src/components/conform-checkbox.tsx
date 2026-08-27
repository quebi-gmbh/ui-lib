"use client"

import { type FieldMetadata, getInputProps } from "@conform-to/react"
import type { CheckboxProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/checkbox"

interface ConformCheckboxProps extends Omit<CheckboxProps, "name" | "defaultSelected"> {
  // A checkbox bound to a boolean form value. Only
  // name/defaultChecked/required/errors are read off the metadata.
  field: FieldMetadata<boolean>
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
      {/* getInputProps() puts aria-describedby={field.errorId} on the control
          whenever the field is invalid, so the message has to carry that id —
          without it the attribute points at nothing and the error is never
          announced. RAC's <FieldError> is not usable here: it renders null
          unless a FieldErrorContext supplies isInvalid, and a bare Checkbox
          (unlike TextField or CheckboxGroup) provides none. */}
      {hasErrors && (
        <p id={field.errorId} className="block text-[12px] text-red-500">
          {field.errors?.join(", ")}
        </p>
      )}
    </div>
  )
}
