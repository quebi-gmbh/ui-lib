"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import type { RadioGroupProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { RadioGroup } from "@/components/radio"

export interface ConformRadioGroupProps
  extends Omit<
    RadioGroupProps,
    "name" | "form" | "value" | "defaultValue" | "isRequired" | "isInvalid" | "children"
  > {
  /** A radio group bound to a string form value — the selected Radio's `value`. */
  field: FieldMetadata<string>
  label?: string
  description?: string
}

/**
 * ConformRadioGroup — RadioGroup wired to Conform.
 *
 * Binds a string Conform field to the quebi RadioGroup: derives name, form,
 * required, default selection, and validity from the field metadata and renders
 * inline errors. Pass the options (Radio) as children.
 *
 * The name goes on the group, not on each Radio — react-aria puts it on every
 * native radio input beneath, which is what makes exactly one value submit.
 */
export function ConformRadioGroup({
  field,
  label,
  description,
  children,
  className,
  ...props
}: PropsWithChildren<ConformRadioGroupProps>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <RadioGroup
      {...props}
      name={field.name}
      form={field.formId}
      defaultValue={(field.initialValue as string) ?? ""}
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
    </RadioGroup>
  )
}
