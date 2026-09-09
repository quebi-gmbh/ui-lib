"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  AsyncMultipleSelect,
  type AsyncMultipleSelectOption,
  type AsyncMultipleSelectProps,
} from "@/components/async-multiple-select"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"

export interface ConformAsyncMultipleSelectProps<T extends AsyncMultipleSelectOption>
  extends Omit<
    AsyncMultipleSelectProps<T>,
    "name" | "form" | "id" | "value" | "defaultValue" | "isInvalid" | "aria-describedby"
  > {
  /** A multi-value select bound to a string-array form value — the chosen options' ids. */
  field: FieldMetadata<string[]>
  label?: string
  description?: string
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
 * name, id, form, and validity from the field metadata, mirrors the selection
 * into hidden inputs for submission, and renders inline errors. Provide `load`
 * to fetch options and `defaultSelected` to seed labelled tags from the field's
 * initial value.
 */
export function ConformAsyncMultipleSelect<T extends AsyncMultipleSelectOption>({
  field,
  label,
  description,
  defaultSelected,
  className,
  ...props
}: ConformAsyncMultipleSelectProps<T>) {
  const defaultValue = useMemo<T[]>(() => {
    if (defaultSelected) return defaultSelected
    const initial = (field.initialValue as string[] | undefined) ?? []
    return initial.map((id) => ({ id, name: id }) as T)
  }, [defaultSelected, field.initialValue])

  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={field.id} className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <AsyncMultipleSelect<T>
        {...props}
        id={field.id}
        name={field.name}
        form={field.formId}
        defaultValue={defaultValue}
        isInvalid={hasErrors}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      />
      {/* These ids are ours to set: AsyncMultipleSelect is a hand-built
          combobox, not a react-aria field, so nothing generates them and the
          aria-describedby above is their only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
