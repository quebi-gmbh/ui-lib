"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { parseTime, type Time } from "@internationalized/date"
import { useRef } from "react"
import type { TimeFieldProps, TimeValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Description, FieldError, focusFirstControl, Label } from "@/components/field"
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
 * Three rules govern the registered input, all silent when broken:
 *
 * 1. It is never `type="hidden"`. `register()` strips the type once; React
 *    re-applies it on the next commit and then keeps forcing the value back to
 *    `defaultValue`, so every change is lost.
 * 2. It never takes a React `value` prop. `control.change()` writes the DOM
 *    value and React would revert it on the next commit, leaving FormData with
 *    the React-owned value.
 * 3. It is hidden by CSS (`sr-only` + `tabIndex={-1}`), never by the `hidden`
 *    attribute — which is what `BaseControl` renders by default, so every one
 *    of these variants passes `hidden={false}`. After a failed submit Conform's
 *    v1 `useForm` focuses the first errored field with a bare
 *    `element.focus()`, and a real browser no-ops that on a `hidden` element:
 *    the focus lands nowhere, `useControl` never sees a `focusin`, and
 *    `onFocus` below never runs. jsdom and happy-dom both focus hidden
 *    elements happily, so a DOM test agrees with whatever you wrote — this one
 *    was settled in Chrome (task #11).
 *
 * `BaseControl` is what enforces 1 and 2, which is why the input is rendered
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
    // Conform focuses the first errored field after a failed submit; that is
    // the registered input, which nobody can see — hand it to the segments.
    onFocus() {
      focusFirstControl(inputRef.current)
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
        hidden={false}
        tabIndex={-1}
        className="sr-only"
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
      {/* No ids and no aria-describedby here: this is a react-aria field, so it
          generates the description and error ids and already points the control
          at them. Setting id={field.errorId} would not break that — on mount
          react-aria re-points the control at whatever id the element actually
          carries — it would just duplicate wiring that is already correct.
          Outside a react-aria field the ids are yours: see ConformSwitch. */}
      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </TimeField>
  )
}
