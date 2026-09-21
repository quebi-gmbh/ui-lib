"use client"

import type { FieldMetadata } from "@conform-to/react"
import { composeRenderProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import {
  ColorField,
  ColorFieldGroup,
  type ColorFieldProps,
  ColorInput,
} from "@/components/color-field"
import { Description, FieldError, fieldStyles, Label } from "@/components/field"

export interface ConformColorFieldProps
  extends Omit<
    ColorFieldProps,
    "name" | "form" | "value" | "defaultValue" | "isRequired" | "isInvalid" | "children"
  > {
  /**
   * A hex colour bound to a string form value. Without a `channel` the field is
   * a HexColorField, so the wire value is `"#RRGGBB"` — a plain string, not a
   * serialised Color.
   */
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
}

/**
 * ConformColorField — ColorField wired to Conform.
 *
 * Binds a hex-string Conform field to the quebi ColorField: derives name, id,
 * form, required, default, and validity from the field metadata and renders
 * inline errors. The visible input is the real form control, so there is no
 * hidden mirror here — unlike `conform-color-picker`, which drives a popover.
 */
export function ConformColorField({
  field,
  label,
  placeholder,
  description,
  className,
  ...props
}: ConformColorFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const initialValue = (field.initialValue as string) ?? ""

  return (
    <ColorField
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultValue={initialValue === "" ? null : initialValue}
      isRequired={isRequired}
      isInvalid={hasErrors}
      // A `label` is rendered as a real `<Label>` below, and react-aria folds
      // an `aria-label` into the input's `aria-labelledby` chain *alongside*
      // it — so `?? label` announced "Brand color Brand color" (task #147).
      // The literal is only for the unlabelled case, where nothing else names
      // the control.
      aria-label={props["aria-label"] ?? (label ? undefined : "Color")}
      className={composeRenderProps(className, (resolved) => cn(fieldStyles, resolved))}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}
        </Label>
      )}
      <ColorFieldGroup>
        <ColorInput placeholder={placeholder} />
      </ColorFieldGroup>
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </ColorField>
  )
}
