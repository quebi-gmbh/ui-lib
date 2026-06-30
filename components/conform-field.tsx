import { type FieldMetadata, getInputProps } from "@conform-to/react"
import { TextField, type TextFieldProps } from "react-aria-components"
import { cn } from "../utils/cn"
import { Description, FieldError, Label } from "./field"
import { Input } from "./input"

type InputProps = Omit<TextFieldProps, "type"> & { type?: "email" | "password" | "text" }

export interface ConformFieldProps extends InputProps {
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
}

export function ConformField({
  field,
  label,
  type = "text",
  placeholder,
  description,
  ...restProps
}: ConformFieldProps) {
  const hasErrors = !field.valid && field.errors
  const isRequired = field.required || false

  // Strip defaultValue and required from conform props.
  // Pass defaultValue explicitly to TextField (React Aria consumes it for initial state).
  // The remaining props (name, id, form, type, aria-*) go to TextField which distributes
  // them to Input via InputContext.
  const { required: _required, defaultValue, ...conformProps } = getInputProps(field, { type })

  return (
    <TextField
      {...restProps}
      {...conformProps}
      defaultValue={(defaultValue as string) ?? ""}
      isRequired={isRequired}
      isInvalid={!!hasErrors}
      className="flex flex-col gap-1"
    >
      {label && (
        <Label htmlFor={field.id} className={cn(hasErrors && "text-danger")}>
          {label}
          {isRequired && <span className="ml-1 text-danger">*</span>}
        </Label>
      )}
      <Input placeholder={placeholder} />
      {description && <Description className="mt-1">{description}</Description>}
      <FieldError className="mt-1">{field.errors?.join(", ")}</FieldError>
    </TextField>
  )
}
