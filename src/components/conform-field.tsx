"use client"

import type { FieldMetadata } from "@conform-to/react"
import { TextField, type TextFieldProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { Input } from "@/components/input"

type InputProps = Omit<TextFieldProps, "type"> & { type?: "email" | "password" | "text" }

export interface ConformFieldProps
  extends Omit<InputProps, "name" | "form" | "value" | "defaultValue" | "isRequired" | "isInvalid"> {
  /** A text field bound to a string form value. */
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
}

/**
 * ConformField — text field wired to Conform.
 *
 * Binds a string Conform field to the quebi TextField/Input stack: derives
 * name, id, form, required, default, and validity from the field metadata and
 * renders an inline label, optional description, and field errors.
 *
 * The metadata is read attribute by attribute rather than spread from
 * `getInputProps`. That helper returns the DOM names — `required`,
 * `defaultChecked`, `min`/`max` — and react-aria's controls take `isRequired`,
 * `defaultSelected`, `minValue`/`maxValue`; a JSX spread skips excess-property
 * checking, so the mismatched ones are dropped by `filterDOMProps` with no type
 * error and no attribute left in the DOM to notice. Named props are checked.
 */
export function ConformField({
  field,
  label,
  type = "text",
  placeholder,
  description,
  className,
  ...restProps
}: ConformFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <TextField
      {...restProps}
      id={field.id}
      name={field.name}
      form={field.formId}
      type={type}
      defaultValue={(field.initialValue as string) ?? ""}
      minLength={field.minLength}
      maxLength={field.maxLength}
      pattern={field.pattern}
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
      <Input placeholder={placeholder} />
      {/* No ids on these two: the react-aria field generates its own ids for
          the description and error slots and already points the control at
          them. Setting id={field.errorId} here would replace the id the control
          references, and the message would stop being announced. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </TextField>
  )
}
