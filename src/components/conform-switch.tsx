"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { SwitchProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"
import { Switch } from "@/components/switch"

export interface ConformSwitchProps
  extends Omit<SwitchProps, "name" | "value" | "form" | "defaultSelected" | "isSelected"> {
  /** A switch bound to a boolean form value. */
  field: FieldMetadata<boolean>
  label?: string
  description?: string
}

/**
 * ConformSwitch — Switch wired to Conform.
 *
 * Binds a boolean Conform field to the quebi Switch: derives name, form,
 * default, and the described-by wiring from the field metadata and renders
 * inline errors.
 *
 * Two things about this control specifically:
 *
 * 1. `getInputProps(field, { type: "checkbox" })` must NOT be spread onto it.
 *    Conform returns the DOM names — `defaultChecked` and `required` — and
 *    react-aria's Switch takes neither, so `filterDOMProps` drops both without
 *    a TS error (JSX spread skips excess-property checking) and without a DOM
 *    attribute left behind to notice. The switch then renders off after a
 *    failed submit. Every metadata attribute is therefore read by name here.
 * 2. react-aria's Switch has no `isRequired`/`isInvalid` — it omits them from
 *    its props on purpose, since a switch is never "unfilled". Required is a
 *    schema concern; invalidity is announced through `aria-describedby` and the
 *    message below.
 */
export function ConformSwitch({
  field,
  label,
  description,
  className,
  ...props
}: ConformSwitchProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex flex-col gap-2", className)}>
      <Switch
        {...props}
        name={field.name}
        form={field.formId}
        value="on"
        defaultSelected={field.defaultChecked}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {label && (
          <Label elementType="span" className={cn(hasErrors && "text-red-500")}>
            {label}
            {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
          </Label>
        )}
      </Switch>
      {/* These ids are ours to set: the control below is not a react-aria
          field, so nothing generates them and nothing else points at them.
          The aria-describedby above is the only reference they get. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
