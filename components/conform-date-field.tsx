import { type FieldMetadata, getInputProps } from "@conform-to/react"
import { TextField, type TextFieldProps } from "react-aria-components"
import { cn } from "../utils/cn"
import { FieldError, Label } from "./field"
import { Input } from "./input"

interface ConformDateFieldProps extends Omit<TextFieldProps, "type"> {
  field: FieldMetadata<string>
  label?: string
}

export function ConformDateField({ field, label, ...inputProps }: ConformDateFieldProps) {
  const hasErrors = !field.valid && field.errors
  const isRequired = field.required || false

  return (
    <TextField
      {...inputProps}
      {...getInputProps(field, { type: "date" })}
      isRequired={isRequired}
      isInvalid={!!hasErrors}
    >
      {label && (
        <Label htmlFor={field.id} className={cn(hasErrors && "text-danger")}>
          {label}
          {isRequired && <span className="ml-1">*</span>}
        </Label>
      )}
      <Input />

      <FieldError>{field.errors?.join(", ")}</FieldError>
    </TextField>
  )
}
