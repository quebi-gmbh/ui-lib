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
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </RadioGroup>
  )
}
