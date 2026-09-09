"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { MultipleSelect } from "@/components/multiple-select"

export interface ConformMultipleSelectProps {
  /** A multi-value select bound to a string-array form value. */
  field: FieldMetadata<string[]>
  label?: string
  description?: string
  placeholder?: string
  isDisabled?: boolean
  className?: string
  "aria-label"?: string
}

/**
 * ConformMultipleSelect — Multiple Select wired to Conform.
 *
 * Binds a multi-value Conform field to the quebi Multiple Select: derives name,
 * id, form, required, default selection, and validity from the field metadata
 * and renders inline errors. Pass the option list (MultipleSelectContent +
 * MultipleSelectItem) as children.
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
    <MultipleSelect
      id={field.id}
      name={field.name}
      form={field.formId}
      aria-label={ariaLabel ?? label}
      placeholder={placeholder}
      defaultValue={(field.initialValue as string[]) ?? []}
      isRequired={isRequired}
      isInvalid={hasErrors}
      isDisabled={isDisabled}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      {children}
      {/* No ids on these two: the react-aria field generates its own for the
          description and error slots and already points the control at them. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </MultipleSelect>
  )
}
