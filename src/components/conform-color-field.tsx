"use client"

import type { FieldMetadata } from "@conform-to/react"
import { cn } from "@/lib/utils"
import { ColorField, type ColorFieldProps, ColorInput } from "@/components/color-field"
import { Description, FieldError, Label } from "@/components/field"

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
      aria-label={props["aria-label"] ?? label ?? "Color"}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <ColorInput placeholder={placeholder} />
      {/* No ids on these two, and no aria-describedby above: the react-aria
          field generates its own ids for the description and error slots and
          already points the control at them. Setting id={field.errorId} here
          would replace the id the control references, and the message would
          stop being announced — verified, it fails silently. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </ColorField>
  )
}
