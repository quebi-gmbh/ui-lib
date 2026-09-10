"use client"

import type { FieldMetadata } from "@conform-to/react"
import { type PropsWithChildren, useState } from "react"
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
 *
 * With nothing chosen, though, a radio group submits *nothing*: an unchecked
 * radio is not a successful control, so the name is absent from `FormData`
 * altogether. For a string field that is the difference between the schema's
 * own "Pick a plan" and valibot's internal `Invalid key: Expected "plan" but
 * received undefined`, and no schema the consumer can write fixes it —
 * `@conform-to/valibot` coerces both `""` and absent to `undefined` inside the
 * pipe, so the message only differs by which one arrives. Submitting `""` puts
 * the key back and the author's message is the one that shows.
 *
 * That is what the hidden input below is: an empty-string stand-in for the
 * unchecked group, the same job react-aria's own `HiddenSelect` gives its
 * leading `<option value="">` (which is how `ConformSelect` and
 * `ConformChoiceBox` already avoid this). It is rendered *only* while nothing
 * is selected, because a radio and a sentinel under one name would put two
 * entries in `FormData` and Conform parses a repeated key as an array — the
 * string field would arrive as `["", "pro"]`. Hence the mirrored selection
 * state: the group stays uncontrolled (a native reset then restores the radios
 * themselves), and react-aria's `useFormReset` routes that reset back through
 * `onChange`, so the sentinel comes back with them.
 *
 * `type="hidden"` is deliberate here, unlike the `hidden` attribute the
 * registered `BaseControl` inputs use (see `conform-time-field`): this input is
 * not a Conform control and must never be written to. Conform skips
 * `type="hidden"` inputs when it applies form values, which is exactly the
 * treatment a sentinel wants.
 */
export function ConformRadioGroup({
  field,
  label,
  description,
  children,
  className,
  onChange,
  ...props
}: PropsWithChildren<ConformRadioGroupProps>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const initialValue = (field.initialValue as string) ?? ""
  const [value, setValue] = useState(initialValue)

  return (
    <RadioGroup
      {...props}
      name={field.name}
      form={field.formId}
      defaultValue={initialValue}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
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
      {value === "" && <input type="hidden" name={field.name} form={field.formId} value="" />}
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
