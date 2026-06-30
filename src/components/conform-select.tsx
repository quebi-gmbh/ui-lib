"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { FieldError, Label } from "@/components/field"
import { Select, SelectContent, SelectTrigger } from "@/components/select"

interface ConformSelectProps {
  // A single-value select field from any form schema. Only
  // name/id/initialValue/value/errors are read off the metadata; the value type
  // param is loose because schemas vary per call site.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  isDisabled?: boolean
}

/**
 * ConformSelect — Select wired to Conform.
 *
 * Binds a single-value Conform field to the quebi Select: derives name, id,
 * default selection, and validity from the field metadata and renders inline
 * errors. Pass option items (SelectItem) as children.
 */
export function ConformSelect({
  field,
  children,
  label,
  isDisabled,
}: PropsWithChildren<ConformSelectProps>) {
  return (
    <div>
      <Select
        id={field.id}
        name={field.name}
        defaultSelectedKey={(field.initialValue as string) || (field.value as string) || ""}
        isInvalid={!!field.errors}
        isDisabled={isDisabled}
      >
        {label && <Label htmlFor={field.id}>{label}</Label>}
        <SelectTrigger />
        <SelectContent>{children}</SelectContent>
        <FieldError>{field.errors?.join(", ")}</FieldError>
      </Select>
    </div>
  )
}
