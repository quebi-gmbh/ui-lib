"use client"

import type { FieldMetadata } from "@conform-to/react"
import { TextField, type TextFieldProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { Textarea } from "@/components/textarea"

export interface ConformTextareaProps
  extends Omit<
    TextFieldProps,
    "name" | "form" | "type" | "value" | "defaultValue" | "isRequired" | "isInvalid" | "children"
  > {
  /** A multi-line text field bound to a string form value. */
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
  rows?: number
}

/**
 * ConformTextarea — Textarea wired to Conform.
 *
 * Binds a string Conform field to the quebi Textarea: derives name, id, form,
 * required, default, and validity from the field metadata and renders an inline
 * label, optional description, and field errors.
 *
 * `conform-field` cannot cover this case — its `type` union is text/email/
 * password, which is a single-line input by definition.
 */
export function ConformTextarea({
  field,
  label,
  placeholder,
  description,
  rows,
  className,
  ...props
}: ConformTextareaProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <TextField
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultValue={(field.initialValue as string) ?? ""}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <Textarea placeholder={placeholder} rows={rows} />
      {/* No ids on these two, and no aria-describedby above: the react-aria
          field generates its own ids for the description and error slots and
          already points the control at them. Setting id={field.errorId} here
          would replace the id the control references, and the message would
          stop being announced — verified, it fails silently. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </TextField>
  )
}
