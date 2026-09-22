"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { type CalendarDate, parseDate } from "@internationalized/date"
import { useRef } from "react"
import type { CalendarProps, DateValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/calendar"
import {
  describedBy,
  Description,
  Field,
  FieldError,
  focusFirstControl,
  Label,
} from "@/components/field"

export interface ConformCalendarProps
  extends Omit<
    CalendarProps<DateValue>,
    "value" | "defaultValue" | "onChange" | "isInvalid" | "className"
  > {
  /** A date bound to a string form value — ISO `YYYY-MM-DD`. */
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
 * ConformCalendar — an always-visible Calendar wired to Conform.
 *
 * Binds a date Conform field to the quebi Calendar through a registered hidden
 * input carrying an ISO `YYYY-MM-DD` string. react-aria's Calendar has no
 * `name` and renders no form control — it is a picker, not a field — so the
 * hidden input is the whole form value.
 *
 * Reach for `conform-date-picker` unless the calendar has to stay on screen;
 * the popover variant is the common case and needs no custom control.
 *
 * `BaseControl` renders the input with no React `value` prop and no
 * `type="hidden"`, and this passes `hidden={false}` so the input stays
 * focusable for Conform's focus-on-error; all three matter and all three fail
 * silently — see `conform-time-field`.
 */
export function ConformCalendar({
  field,
  label,
  description,
  className,
  ...props
}: ConformCalendarProps) {
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
      // `w-fit` rather than the `w-full` every other field root wears: a
      // calendar is a grid of fixed-size cells with an intrinsic width, and a
      // field root stretched across a column leaves it stranded at one end.
      // Note that this does not keep the calendar's own chrome over its grid —
      // `w-fit` is max-content, and the description line below is wider than
      // seven day cells, so the root sizes to the hint. `Calendar` is `w-fit`
      // itself for that; see the note on its root.
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

      {/* The calendar is the control, and says so: `Calendar` marks itself
          `data-slot="calendar"`, so the field stack and `FieldRow` need this
          wrapper to find it. */}
      <div data-slot="control">
        <Calendar
          {...props}
          value={toCalendarDate(control.value)}
          onChange={(value) => control.change(value ? value.toString() : "")}
          isInvalid={hasErrors}
          aria-label={props["aria-label"] ?? label}
          aria-describedby={describedBy(
            hasErrors && field.errorId,
            description && field.descriptionId,
          )}
        />
      </div>

      {/* These ids are ours to set: react-aria only owns the ids of children
          rendered inside its field, and these are siblings of the calendar
          above, not children of it. The aria-describedby above is the only
          reference they get. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
