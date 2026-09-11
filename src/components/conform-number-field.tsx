"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { NumberFieldProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { NumberField, NumberInput, type NumberInputSize } from "@/components/number-field"

export interface ConformNumberFieldProps
  extends Omit<
    NumberFieldProps,
    | "name"
    | "form"
    | "value"
    | "defaultValue"
    | "onChange"
    | "minValue"
    | "maxValue"
    | "isRequired"
    | "isInvalid"
  > {
  /**
   * A numeric field: the wire value is a string that Conform coerces to a
   * number, so the metadata carries `number | string`.
   */
  field: FieldMetadata<number | string>
  label?: string
  description?: string
  /**
   * Hide the increment / decrement steppers. Forwarded to `NumberInput`,
   * because a narrow field has no room for them: they are ~74px wide and the
   * input gives up its own width before they give up theirs.
   */
  hideStepper?: boolean
  /** Control height. Matches `Input`'s scale and `Button`'s `xs` / `sm`. */
  size?: NumberInputSize
}

/** Read a Conform constraint, which arrives as a string on the wire, as a number. */
function toNumber(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined
  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * ConformNumberField — NumberField wired to Conform.
 *
 * Binds a numeric Conform field to the quebi NumberField: derives name, id,
 * form, required, default, the schema's min/max/step, and validity from the
 * field metadata and renders inline errors.
 *
 * The constraints are mapped by hand on purpose. Conform names them `min` and
 * `max` (the DOM attributes); react-aria's NumberField takes `minValue` and
 * `maxValue` and ignores the DOM pair — passing them through silently discards
 * the schema's bounds, so a `max: 10` field happily holds 99.
 */
export function ConformNumberField({
  field,
  label,
  description,
  hideStepper,
  size,
  className,
  ...props
}: ConformNumberFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <NumberField
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultValue={toNumber(field.initialValue as number | string | undefined)}
      minValue={toNumber(field.min)}
      maxValue={toNumber(field.max)}
      step={toNumber(field.step)}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn(className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <NumberInput hideStepper={hideStepper} size={size} />
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description className="mt-1">{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </NumberField>
  )
}
