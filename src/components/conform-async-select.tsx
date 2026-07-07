"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useMemo } from "react"
import {
  AsyncSelect,
  type AsyncSelectOption,
  type AsyncSelectProps,
} from "@/components/async-select"
import { FieldError, Label } from "@/components/field"

interface ConformAsyncSelectProps<T extends AsyncSelectOption>
  extends Omit<AsyncSelectProps<T>, "name" | "defaultValue" | "isInvalid"> {
  // A single-value select field from any form schema. Only
  // name/id/initialValue/errors are read off the metadata; the value type param
  // is loose because schemas vary per call site.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  /**
   * Initial selection as a full option object so the input can show its label.
   * Falls back to the field's initial id (label = id) when omitted — pass this
   * whenever the label differs from the stored id.
   */
  defaultSelected?: T
}

/**
 * ConformAsyncSelect — Async Select wired to Conform.
 *
 * Binds a single-value Conform field to the quebi Async Select: derives name
 * and validity from the field metadata, mirrors the remote-loaded selection
 * into a hidden input for submission, and renders inline errors. Provide `load`
 * to fetch options and `defaultSelected` to seed the input label from the
 * field's initial value.
 */
export function ConformAsyncSelect<T extends AsyncSelectOption>({
  field,
  label,
  defaultSelected,
  ...props
}: ConformAsyncSelectProps<T>) {
  const defaultValue = useMemo<T | null>(() => {
    if (defaultSelected) return defaultSelected
    const initial = field.initialValue as string | undefined
    return initial ? ({ id: initial, name: initial } as T) : null
  }, [defaultSelected, field.initialValue])

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={field.id}>{label}</Label>}
      <AsyncSelect<T>
        {...props}
        id={field.id}
        name={field.name}
        defaultValue={defaultValue}
        isInvalid={!!field.errors}
      />
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </div>
  )
}
