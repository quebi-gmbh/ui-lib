"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useMemo } from "react"
import {
  AsyncMultipleSelect,
  type AsyncMultipleSelectOption,
  type AsyncMultipleSelectProps,
} from "@/components/async-multiple-select"
import { FieldError, Label } from "@/components/field"

interface ConformAsyncMultipleSelectProps<T extends AsyncMultipleSelectOption>
  extends Omit<AsyncMultipleSelectProps<T>, "name" | "defaultValue" | "isInvalid"> {
  // A multi-value select field from any form schema. Only
  // name/initialValue/errors are read off the metadata; the value type param is
  // loose because schemas vary per call site.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  /**
   * Initial selection as full option objects so tags render labels. Falls back
   * to the field's initial ids (label = id) when omitted — pass this whenever
   * the label differs from the stored id.
   */
  defaultSelected?: T[]
}

/**
 * ConformAsyncMultipleSelect — Async Multiple Select wired to Conform.
 *
 * Binds a multi-value Conform field to the quebi Async Multiple Select: derives
 * name and validity from the field metadata, mirrors the selection into hidden
 * inputs for submission, and renders inline errors. Provide `load` to fetch
 * options and `defaultSelected` to seed labelled tags from the field's initial value.
 */
export function ConformAsyncMultipleSelect<T extends AsyncMultipleSelectOption>({
  field,
  label,
  defaultSelected,
  ...props
}: ConformAsyncMultipleSelectProps<T>) {
  const defaultValue = useMemo<T[]>(() => {
    if (defaultSelected) return defaultSelected
    const initial = (field.initialValue as string[] | undefined) ?? []
    return initial.map((id) => ({ id, name: id }) as T)
  }, [defaultSelected, field.initialValue])

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={field.id}>{label}</Label>}
      <AsyncMultipleSelect<T>
        {...props}
        name={field.name}
        defaultValue={defaultValue}
        isInvalid={!!field.errors}
      />
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </div>
  )
}
