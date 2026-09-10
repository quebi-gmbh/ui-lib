"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"
import { InputOTP } from "@/components/input-otp"

export interface ConformInputOTPProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof InputOTP>,
    "name" | "form" | "value" | "onChange" | "defaultValue" | "required" | "children" | "render"
  > {
  /** A one-time code bound to a string form value. */
  field: FieldMetadata<string>
  label?: string
  description?: string
}

/**
 * ConformInputOTP — InputOTP wired to Conform.
 *
 * Binds a string Conform field to the quebi InputOTP: derives name, id, form,
 * required, default, and validity from the field metadata and renders inline
 * errors. Pass the slot layout (InputOTPGroup + InputOTPSlot) as children.
 *
 * `input-otp` renders a real `<input>` and its props are the DOM ones, so the
 * metadata lands under its own names here — `required` and `aria-invalid`,
 * not react-aria's `isRequired`/`isInvalid`.
 */
export function ConformInputOTP({
  field,
  label,
  description,
  children,
  className,
  ...props
}: PropsWithChildren<ConformInputOTPProps>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={field.id} className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <InputOTP
        {...props}
        id={field.id}
        name={field.name}
        form={field.formId}
        defaultValue={(field.initialValue as string) ?? ""}
        required={isRequired}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {children}
      </InputOTP>
      {/* These ids are ours to set: the control above is not a react-aria
          field, so nothing generates them and its aria-describedby is their
          only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
