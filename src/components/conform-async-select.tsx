"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  AsyncSelect,
  type AsyncSelectOption,
  type AsyncSelectProps,
} from "@/components/async-select"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"

export interface ConformAsyncSelectProps<T extends AsyncSelectOption>
  extends Omit<
    AsyncSelectProps<T>,
    "name" | "form" | "id" | "value" | "defaultValue" | "isInvalid" | "aria-describedby"
  > {
  /** A single-value select bound to a string form value — the chosen option's id. */
  field: FieldMetadata<string>
  label?: string
  description?: string
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
 * Binds a single-value Conform field to the quebi Async Select: derives name,
 * id, form, and validity from the field metadata, mirrors the remote-loaded
 * selection into a hidden input for submission, and renders inline errors.
 * Provide `load` to fetch options and `defaultSelected` to seed the input label
 * from the field's initial value.
 */
export function ConformAsyncSelect<T extends AsyncSelectOption>({
  field,
  label,
  description,
  defaultSelected,
  className,
  ...props
}: ConformAsyncSelectProps<T>) {
  const defaultValue = useMemo<T | null>(() => {
    if (defaultSelected) return defaultSelected
    const initial = field.initialValue as string | undefined
    return initial ? ({ id: initial, name: initial } as T) : null
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
      <AsyncSelect<T>
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
      {/* These ids are ours to set: AsyncSelect is a hand-built combobox, not a
          react-aria field, so nothing generates them and the aria-describedby
          above is their only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
