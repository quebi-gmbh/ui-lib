"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { parseTime, type Time } from "@internationalized/date"
import { useRef } from "react"
import type { TimeFieldProps, TimeValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, Label } from "@/components/field"
import { TimeField, TimeInput } from "@/components/time-field"

export interface ConformTimeFieldProps
  extends Omit<
    TimeFieldProps<TimeValue>,
    "name" | "form" | "value" | "defaultValue" | "onChange" | "isRequired" | "isInvalid" | "children"
  > {
  /** A time bound to a string form value — `HH:MM[:SS]`, what `Time#toString()` produces. */
  field: FieldMetadata<string>
  label?: string
  description?: string
}

/** Parse the wire value (`"09:30"` / `"09:30:00"`) into a Time, tolerating junk. */
function toTime(value: string | undefined): Time | null {
  if (!value) return null
  try {
    return parseTime(value)
  } catch {
    return null
  }
}

/**
 * ConformTimeField — TimeField wired to Conform.
 *
 * Binds a string Conform field to the quebi TimeField, through a registered
 * hidden input that carries `Time#toString()`.
 *
 * The hidden input is not belt-and-braces — it is the whole form value.
 * `AriaTimeFieldProps extends InputDOMProps`, so `name` type-checks on a
 * TimeField, but react-aria renders a hidden date input for DateField only:
 * a named TimeField submits nothing at all.
 *
 * Two rules govern the registered input, both silent when broken:
 *
 * 1. It uses the `hidden` **attribute**, never `type="hidden"`. `register()`
 *    strips the type once; React re-applies it on the next commit and then
 *    keeps forcing the value back to `defaultValue`, so every change is lost.
 * 2. It never takes a React `value` prop. `control.change()` writes the DOM
 *    value and React would revert it on the next commit, leaving FormData with
 *    the React-owned value.
 *
 * `BaseControl` is what enforces both, which is why the input is rendered
 * through it rather than by hand.
 */
export function ConformTimeField({
  field,
  label,
  description,
  className,
  ...props
}: ConformTimeFieldProps) {
  const inputRef = useRef<HTMLDivElement>(null)
  const control = useControl({
    defaultValue: (field.initialValue as string) ?? "",
    // Conform focuses the first errored field after a failed submit; the
    // registered input is hidden, so forward it to the visible segments.
    onFocus() {
      inputRef.current?.querySelector<HTMLElement>("[role='spinbutton']")?.focus()
    },
  })

  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <TimeField
      {...props}
      value={toTime(control.value)}
      onChange={(value) => control.change(value ? value.toString() : "")}
      onBlur={() => control.blur()}
      isRequired={isRequired}
      isInvalid={hasErrors}
      className={cn("w-full", className)}
    >
      <BaseControl
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue ?? ""}
      />
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      <div ref={inputRef}>
        <TimeInput />
      </div>
      {/* No ids on these two, and no aria-describedby above: the react-aria
          field generates its own ids for the description and error slots and
          already points the control at them. Setting id={field.errorId} here
          would replace the id the control references, and the message would
          stop being announced — verified, it fails silently. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </TimeField>
  )
}
