"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { FieldError, Label } from "@/components/field"
import { MultipleSelect } from "@/components/multiple-select"

interface ConformMultipleSelectProps {
  // A multi-value select field from any form schema. Only
  // name/initialValue/errors are read off the metadata; the value type param is
  // loose because schemas vary per call site.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  placeholder?: string
  isDisabled?: boolean
  "aria-label"?: string
}

/**
 * ConformMultipleSelect — Multiple Select wired to Conform.
 *
 * Binds a multi-value Conform field to the quebi Multiple Select: derives name,
 * default selection, and validity from the field metadata and renders inline
 * errors. Pass the option list (MultipleSelectContent + MultipleSelectItem) as children.
 */
export function ConformMultipleSelect({
  field,
  children,
  label,
  placeholder,
  isDisabled,
  "aria-label": ariaLabel,
}: PropsWithChildren<ConformMultipleSelectProps>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={field.id}>{label}</Label>}
      <MultipleSelect
        id={field.id}
        name={field.name}
        aria-label={ariaLabel ?? label}
        placeholder={placeholder}
        defaultValue={(field.initialValue as string[]) ?? []}
        isInvalid={!!field.errors}
        isDisabled={isDisabled}
      >
        {children}
      </MultipleSelect>
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </div>
  )
}
