"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import type { CheckboxGroupProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { CheckboxGroup } from "@/components/checkbox"
import { Description, FieldError, Label } from "@/components/field"

export interface ConformCheckboxGroupProps
  extends Omit<
    CheckboxGroupProps,
    "name" | "form" | "value" | "defaultValue" | "isRequired" | "isInvalid" | "children"
  > {
  /**
   * A checkbox group bound to a string-array form value — the `value` of every
   * checked box. Distinct from `conform-checkbox`, which binds one boolean.
   * Each box submits under the same name, so the schema reads them with
   * `v.array(...)`.
   */
  field: FieldMetadata<string[]>
  label?: string
  description?: string
}

/**
 * ConformCheckboxGroup — CheckboxGroup wired to Conform.
 *
 * Binds a multi-value Conform field to the quebi CheckboxGroup: derives name,
 * form, required, default selection, and validity from the field metadata and
 * renders inline errors. Pass the options (Checkbox, each with a `value`) as
 * children.
 */
export function ConformCheckboxGroup({
  field,
  label,
  description,
  children,
  className,
  ...props
}: PropsWithChildren<ConformCheckboxGroupProps>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const initialValue = field.initialValue

  return (
    <CheckboxGroup
      {...props}
      name={field.name}
      form={field.formId}
      defaultValue={
        Array.isArray(initialValue)
          ? (initialValue as string[])
          : typeof initialValue === "string"
            ? [initialValue]
            : []
      }
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn("flex flex-col gap-3", className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      {children}
      {/* No ids on these two, and no aria-describedby above: the react-aria
          field generates its own ids for the description and error slots and
          already points the control at them. Setting id={field.errorId} here
          would replace the id the control references, and the message would
          stop being announced — verified, it fails silently. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </CheckboxGroup>
  )
}
