"use client"

import { type FieldMetadata, getInputProps } from "@conform-to/react"
import { TextField, type TextFieldProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { Input } from "@/components/input"

type InputProps = Omit<TextFieldProps, "type"> & { type?: "email" | "password" | "text" }

export interface ConformFieldProps extends InputProps {
  // A text field from any form schema. The value type param is loose because
  // text fields can surface differently per zod schema; only
  // name/id/form/default/required/errors are used here.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  placeholder?: string
  description?: string
}

/**
 * ConformField — text field wired to Conform.
 *
 * Binds a string Conform field to the quebi TextField/Input stack: derives
 * name, required, default, and validity from the field metadata and renders
 * an inline label, optional description, and field errors.
 */
export function ConformField({
  field,
  label,
  type = "text",
  placeholder,
  description,
  ...restProps
}: ConformFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  // Strip defaultValue and required from conform props.
  // Pass defaultValue explicitly to TextField (React Aria consumes it for initial state).
  // The remaining props (name, id, form, type, aria-*) go to TextField which distributes
  // them to Input via InputContext.
  const { required: _required, defaultValue, ...conformProps } = getInputProps(field, { type })

  return (
    <TextField
      {...restProps}
      {...conformProps}
      defaultValue={(defaultValue as string) ?? ""}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className="flex flex-col gap-1.5"
    >
      {label && (
        <Label htmlFor={field.id} className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <Input placeholder={placeholder} />
      {description && <Description>{description}</Description>}
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </TextField>
  )
}
