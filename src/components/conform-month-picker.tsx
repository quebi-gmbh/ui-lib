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
import { MonthPicker, type MonthPickerProps } from "@/components/month-picker"

export interface ConformMonthPickerProps
  extends Omit<
    MonthPickerProps,
    "value" | "defaultValue" | "onChange" | "className" | "autoFocus"
  > {
  /** A month bound to a string form value — ISO `YYYY-MM-DD`, the first of it. */
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
 * ConformMonthPicker — the Month Picker wired to Conform.
 *
 * Binds a date Conform field to the quebi MonthPicker through a registered
 * hidden input carrying an ISO `YYYY-MM-DD` string — the first of the chosen
 * month, or the clamped date when `minValue`/`maxValue` lands mid-month. The
 * picker is a react-stately ListBox with no `name` and no form control of its
 * own, so the hidden input is the whole form value, exactly as in
 * `conform-calendar`.
 *
 * The other candidate was `YYYY-MM`, which is what `<input type="month">` and a
 * good many APIs use. A full ISO date wins here because the wire format is
 * shared with every other variant in the category: one `parseDate` on the way
 * in, `v.date()` coercion or a string comparison on the server, and
 * `value.slice(0, 7)` for a consumer whose API really does want `2026-09`.
 * `YYYY-MM` would have bought that one consumer a shorter string and charged
 * everyone else a bespoke parser at both ends.
 *
 * The grid is bound rather than `MonthPickerField`'s popover trigger, because
 * `aria-describedby` reaches the grid and not the trigger — same reasoning, and
 * the same shape, as ConformCalendar binding Calendar.
 *
 * `BaseControl` renders the input with no React `value` prop and no
 * `type="hidden"`, and this passes `hidden={false}` so the input stays
 * focusable for Conform's focus-on-error; all three matter and all three fail
 * silently — see `conform-time-field`.
 */
export function ConformMonthPicker({
  field,
  label,
  description,
  className,
  ...props
}: ConformMonthPickerProps) {
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
    <Field
      ref={fieldRef}
      // `w-fit` rather than the `w-full` every other field root wears: this is
      // a grid of fixed-size cells with an intrinsic width, and stretching the
      // root only pulls its header chrome away from the grid under it.
      className={cn("w-fit", className)}
    >
      {/* First, before the label: the stack is spaced with `label + control`
          selectors, and an `sr-only` element between the two is still an
          element the selector cannot see past. */}
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
          {isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}
        </Label>
      )}

      {/* The grid is the control; it carries no `data-slot` of its own, so
          this wrapper is what the field stack and `FieldRow` place. */}
      <div data-slot="control">
        <MonthPicker
          {...props}
          value={toCalendarDate(control.value)}
          onChange={(value) => control.change(value.toString())}
          aria-label={props["aria-label"] ?? label}
          aria-describedby={describedBy(
            hasErrors && field.errorId,
            description && field.descriptionId,
          )}
        />
      </div>

      {/* These ids are ours to set: react-aria only owns the ids of children
          rendered inside its field, and these are siblings of the grid above,
          not children of it. The aria-describedby above is the only reference
          they get. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
