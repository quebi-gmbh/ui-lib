"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { CheckboxProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/checkbox"
import { describedBy, Description, Field, FieldError } from "@/components/field"

export interface ConformCheckboxProps
  extends Omit<
    CheckboxProps,
    "name" | "form" | "value" | "defaultSelected" | "isSelected" | "isRequired" | "isInvalid"
  > {
  /** A checkbox bound to a boolean form value. */
  field: FieldMetadata<boolean>
  label?: string
  description?: string
}

/**
 * ConformCheckbox — Checkbox wired to Conform.
 *
 * Binds a boolean Conform field to the quebi Checkbox: derives name, form,
 * required, default, and validity from the field metadata and renders inline
 * errors.
 *
 * `getInputProps(field, { type: "checkbox" })` must not be spread onto this
 * control. Conform returns the DOM names, `defaultChecked` and `required`, and
 * react-aria's Checkbox takes `defaultSelected` and `isRequired`: the spread
 * type-checks (JSX skips excess-property checking) and then `filterDOMProps`
 * drops both, so the box renders unchecked after a failed submit with nothing
 * in the DOM to show for it.
 */
export function ConformCheckbox({
  field,
  label,
  description,
  className,
  ...props
}: ConformCheckboxProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex flex-col gap-2", className)}>
      <Checkbox
        {...props}
        name={field.name}
        form={field.formId}
        value="on"
        defaultSelected={field.defaultChecked}
        isRequired={isRequired}
        isInvalid={hasErrors}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {label}
        {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
      </Checkbox>
      {/* These ids are ours to set: a bare Checkbox is not a react-aria field
          (unlike CheckboxGroup, which supplies a FieldErrorContext), so nothing
          generates them and the aria-describedby above is their only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
