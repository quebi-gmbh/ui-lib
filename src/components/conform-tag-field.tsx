"use client"

import type { FieldMetadata } from "@conform-to/react"
import { cn } from "@/lib/utils"
import { describedBy, Field, FieldError } from "@/components/field"
import { TagField, type TagFieldProps } from "@/components/tag-field"

export interface ConformTagFieldProps
  extends Omit<
    TagFieldProps,
    "name" | "form" | "id" | "value" | "defaultValue" | "isRequired" | "isInvalid"
  > {
  /**
   * A tag list bound to a form value. TagField submits the comma-joined tags
   * through one hidden input, so the wire value is a string; a schema that
   * splits it surfaces as `string[]`.
   */
  field: FieldMetadata<string | string[]>
}

/** Read the field's initial value as a tag list, accepting either wire shape. */
function toDefaultTags(initialValue: unknown): string[] {
  if (Array.isArray(initialValue)) return initialValue.map(String)
  if (typeof initialValue === "string" && initialValue !== "") return initialValue.split(",")
  return []
}

/**
 * ConformTagField — TagField wired to Conform.
 *
 * Binds a Conform field to the quebi TagField: derives name, id, form, default
 * tags, and validity from the field metadata and renders inline errors.
 *
 * `isRequired` is deliberately not forwarded. TagField's own required handling
 * installs a `submit` listener that calls `reportValidity()`, which fights the
 * `noValidate` Conform puts on the form — the schema owns "at least one tag"
 * here, and its message is the one rendered below.
 */
export function ConformTagField({ field, className, ...props }: ConformTagFieldProps) {
  const hasErrors = !field.valid && !!field.errors

  return (
    <Field className={cn("flex flex-col gap-1.5", className)}>
      <TagField
        {...props}
        id={field.id}
        name={field.name}
        form={field.formId}
        defaultValue={toDefaultTags(field.initialValue)}
        isInvalid={hasErrors}
        // Only the error id: TagField renders its own description and owns that
        // element's id, so pointing at field.descriptionId would point at nothing.
        aria-describedby={describedBy(hasErrors && field.errorId)}
      />
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
