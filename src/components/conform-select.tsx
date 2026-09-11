"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import type { SelectProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import {
  Select,
  SelectContent,
  SelectTrigger,
  type SelectTriggerSize,
} from "@/components/select"

export interface ConformSelectProps<T extends object>
  extends Omit<
    SelectProps<T>,
    | "name"
    | "form"
    | "selectedKey"
    | "defaultSelectedKey"
    | "isRequired"
    | "isInvalid"
    | "children"
  > {
  /** A single-value select bound to a string form value — the chosen item's key. */
  field: FieldMetadata<string>
  label?: string
  description?: string
  /** Trigger height. Matches `Input`'s scale and `Button`'s `xs` / `sm`. */
  size?: SelectTriggerSize
}

/**
 * ConformSelect — Select wired to Conform.
 *
 * Binds a single-value Conform field to the quebi Select: derives name, id,
 * form, required, default selection, and validity from the field metadata and
 * renders inline errors. Pass option items (SelectItem) as children.
 */
export function ConformSelect<T extends object>({
  field,
  label,
  description,
  children,
  size,
  className,
  ...props
}: PropsWithChildren<ConformSelectProps<T>>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const initialValue = (field.initialValue as string) ?? ""

  return (
    <Select<T>
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultSelectedKey={initialValue === "" ? null : initialValue}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <SelectTrigger size={size} />
      <SelectContent>{children}</SelectContent>
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </Select>
  )
}
