"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"
import { MultipleSelect } from "@/components/multiple-select"
import { cn } from "@/lib/utils"

export interface ConformMultipleSelectProps {
  /** A multi-value select bound to a string-array form value. */
  field: FieldMetadata<string[]>
  label?: string
  description?: string
  placeholder?: string
  isDisabled?: boolean
  className?: string
  /**
   * Only for a field with no visible `label` — an `aria-label` wins over the
   * `<Label htmlFor>` below and would hide it from assistive technology.
   */
  "aria-label"?: string
}

/**
 * ConformMultipleSelect — Multiple Select wired to Conform.
 *
 * Binds a multi-value Conform field to the quebi Multiple Select: derives name,
 * id, form, required, default selection, and validity from the field metadata,
 * mirrors the selection into hidden inputs for submission, and renders inline
 * errors. Pass the option list (MultipleSelectContent + MultipleSelectItem) as
 * children.
 *
 * This is the same wiring as ConformAsyncMultipleSelect, for the same reason:
 * since task #157 Multiple Select is a hand-built combobox rather than a
 * react-aria Select, so nothing generates the description/error ids and nothing
 * points the control at them. They are set here, and `id` lands on the combobox
 * input so the label points at the control a user actually focuses.
 */
export function ConformMultipleSelect({
  field,
  label,
  description,
  placeholder,
  isDisabled,
  className,
  children,
  "aria-label": ariaLabel,
}: PropsWithChildren<ConformMultipleSelectProps>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={field.id} className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}
        </Label>
      )}
      <MultipleSelect
        id={field.id}
        name={field.name}
        form={field.formId}
        aria-label={ariaLabel}
        placeholder={placeholder}
        defaultValue={(field.initialValue as string[]) ?? []}
        isRequired={isRequired}
        isInvalid={hasErrors}
        isDisabled={isDisabled}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {children}
      </MultipleSelect>
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
