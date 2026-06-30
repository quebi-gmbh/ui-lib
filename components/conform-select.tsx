import type { FieldMetadata } from "@conform-to/react"
import type { PropsWithChildren } from "react"
import { FieldError, Label } from "./field"
import { Select, SelectContent, SelectTrigger } from "./select"

export function ConformSelect({
  field,
  children,
  label,
  isDisabled,
}: PropsWithChildren<{ field: FieldMetadata<string>; label?: string; isDisabled?: boolean }>) {
  return (
    <div>
      <Select
        id={field.id}
        name={field.name}
        defaultSelectedKey={field.initialValue || field.value || ""}
        isInvalid={!!field.errors}
        isDisabled={isDisabled}
      >
        {label && <Label htmlFor={field.id}>{label}</Label>}
        <SelectTrigger />
        <SelectContent>{children}</SelectContent>
        <FieldError>{field.errors?.join(", ")}</FieldError>
      </Select>
    </div>
  )
}
