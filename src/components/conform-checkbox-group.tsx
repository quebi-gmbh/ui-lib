"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { composeRenderProps } from "react-aria-components"
import type { CheckboxGroupProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { CheckboxGroup } from "@/components/checkbox"
import { Description, FieldError, fieldStyles, Label } from "@/components/field"

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
      className={composeRenderProps(className, (resolved) =>
        // `block` rather than the group's own flex column: the boxes are one
        // control in one element below, so what is left for the root to space
        // is the field stack — label, control, hint — like every other field.
        cn("block", fieldStyles, resolved),
      )}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}
        </Label>
      )}
      {/* The boxes are one control, so they are wrapped in one element: the
          field stack and `FieldRow` place a field's control, not each of its
          parts, and the 12px between the boxes is this group's own business
          rather than the gap between a label and a control. */}
      <div data-slot="control" className="flex flex-col gap-3">
        {children}
      </div>
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </CheckboxGroup>
  )
}
