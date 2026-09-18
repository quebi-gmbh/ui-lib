"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { type CalendarDate, parseDate } from "@internationalized/date"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import {
  describedBy,
  Description,
  Field,
  FieldError,
  focusFirstControl,
  Label,
} from "@/components/field"
import { YearPicker, type YearPickerProps } from "@/components/year-picker"

export interface ConformYearPickerProps
  extends Omit<YearPickerProps, "value" | "defaultValue" | "onChange" | "className" | "autoFocus"> {
  /** A year bound to a string form value — ISO `YYYY-MM-DD`, January 1 of it. */
  field: FieldMetadata<Date | string>
  label?: string
  description?: string
  className?: string
}

/** Parse the wire value (ISO `YYYY-MM-DD`) into a CalendarDate; null for empty/invalid. */
function toCalendarDate(value: string | undefined): CalendarDate | null {
  if (!value) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/**
 * ConformYearPicker — the Year Picker wired to Conform.
 *
 * Binds a date Conform field to the quebi YearPicker through a registered
 * hidden input carrying an ISO `YYYY-MM-DD` string — January 1 of the chosen
 * year, or the clamped date when `minValue`/`maxValue` lands mid-year. The
 * picker is a react-stately ListBox with no `name` and no form control of its
 * own, so the hidden input is the whole form value, exactly as in
 * `conform-calendar`.
 *
 * A full ISO date rather than a bare `"2026"` on purpose: it is the wire format
 * every other Date & time variant uses, it parses with `parseDate` and coerces
 * with `v.date()` like the rest of them, and the year is `value.slice(0, 4)`
 * for a server that only wants the number. A four-digit token would need its
 * own parser on both sides for nothing.
 *
 * The grid is bound rather than `YearPickerField`'s popover trigger, because
 * `aria-describedby` reaches the grid and not the trigger — same reasoning, and
 * the same shape, as ConformCalendar binding Calendar.
 *
 * `BaseControl` renders the input with no React `value` prop and no
 * `type="hidden"`, and this passes `hidden={false}` so the input stays
 * focusable for Conform's focus-on-error; all three matter and all three fail
 * silently — see `conform-time-field`.
 */
export function ConformYearPicker({
  field,
  label,
  description,
  className,
  ...props
}: ConformYearPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const control = useControl({
    defaultValue: (field.initialValue as string) ?? "",
    // Conform focuses the first errored field after a failed submit; that is
    // the registered control, which nobody can see — hand it to the visible one.
    onFocus() {
      focusFirstControl(fieldRef.current)
    },
  })
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field ref={fieldRef} className={cn("flex w-fit flex-col gap-1.5", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}
        </Label>
      )}

      <BaseControl
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue ?? ""}
        hidden={false}
        tabIndex={-1}
        className="sr-only"
      />

      <YearPicker
        {...props}
        value={toCalendarDate(control.value)}
        onChange={(value) => control.change(value.toString())}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      />

      {/* These ids are ours to set: react-aria only owns the ids of children
          rendered inside its field, and these are siblings of the grid above,
          not children of it. The aria-describedby above is the only reference
          they get. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
