"use client"

import type { FieldMetadata } from "@conform-to/react"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { SearchField, type SearchFieldProps, SearchInput } from "@/components/search-field"

export interface ConformSearchFieldProps
  extends Omit<
    SearchFieldProps,
    "name" | "form" | "value" | "defaultValue" | "isRequired" | "isInvalid" | "children"
  > {
  /** A search field bound to a string form value. */
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
}

/**
 * ConformSearchField — SearchField wired to Conform.
 *
 * Binds a string Conform field to the quebi SearchField: derives name, id,
 * form, required, default, and validity from the field metadata and renders
 * inline errors.
 *
 * Only reach for this when the query is part of a submitted form — a filter box
 * that drives a client-side query has no Conform field behind it and belongs in
 * component state (see the rule's documented exception).
 */
export function ConformSearchField({
  field,
  label,
  placeholder,
  description,
  className,
  ...props
}: ConformSearchFieldProps) {
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <SearchField
      {...props}
      id={field.id}
      name={field.name}
      form={field.formId}
      defaultValue={(field.initialValue as string) ?? ""}
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
      <SearchInput placeholder={placeholder} />
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </SearchField>
  )
}
