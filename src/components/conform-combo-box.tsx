"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"
import { ComboBox, ComboBoxInput, type ComboBoxProps } from "@/components/combo-box"
import { Description, FieldError, Label } from "@/components/field"

export interface ConformComboBoxProps<T extends object>
  extends Omit<
    ComboBoxProps<T>,
    | "name"
    | "form"
    | "selectedKey"
    | "defaultSelectedKey"
    | "inputValue"
    | "defaultInputValue"
    | "isRequired"
    | "isInvalid"
    | "children"
  > {
  /**
   * A combo box bound to a string form value. With the default
   * `formValue="key"` the submitted value is the selected option's key; with
   * `allowsCustomValue` set it is whatever the user typed, and react-aria puts
   * the name on the visible input instead of a hidden one.
   */
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
}

/**
 * ConformComboBox — Combo Box wired to Conform.
 *
 * Binds a string Conform field to the quebi ComboBox: derives name, id, form,
 * required, default selection, and validity from the field metadata and renders
 * inline errors. Pass the option list (ComboBoxContent + ComboBoxItem) as
 * children.
 */
export function ConformComboBox<T extends object>({
  field,
  label,
  placeholder,
  description,
  children,
  className,
  ...props
}: PropsWithChildren<ConformComboBoxProps<T>>) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const initialValue = (field.initialValue as string) ?? ""

  return (
    <ComboBox<T>
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultSelectedKey={initialValue === "" ? null : initialValue}
      defaultInputValue={props.allowsCustomValue ? initialValue : undefined}
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
      <ComboBoxInput placeholder={placeholder} />
      {children}
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </ComboBox>
  )
}
