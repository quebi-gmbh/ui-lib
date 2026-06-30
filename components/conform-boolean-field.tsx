import { type FieldMetadata, getInputProps } from "@conform-to/react"
import type { CheckboxProps } from "react-aria-components"
import { cn } from "../utils/cn"
import { Checkbox } from "./checkbox"
import { FieldError } from "./field"

interface ConformBooleanFieldProps extends Omit<CheckboxProps, "name" | "defaultSelected"> {
  field: FieldMetadata<boolean>
  label?: string
}

export function ConformBooleanField({ field, label, ...checkboxProps }: ConformBooleanFieldProps) {
  const hasErrors = !field.valid && field.errors
  const isRequired = field.required || false
  const inputProps = getInputProps(field, { type: "checkbox" })

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        {...checkboxProps}
        {...inputProps}
        defaultSelected={field.defaultChecked}
        isRequired={isRequired}
        isInvalid={!!hasErrors}
        className={cn("flex items-center space-x-2", checkboxProps.className)}
      >
        {label}
      </Checkbox>
      {field.errors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </div>
  )
}
