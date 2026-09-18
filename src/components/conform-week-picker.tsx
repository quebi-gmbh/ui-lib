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
import { WeekPicker, type WeekPickerProps, type WeekRange } from "@/components/week-picker"

/** The wire shape: two ISO `YYYY-MM-DD` strings, submitted as `<name>.start` / `<name>.end`. */
export interface ConformWeekRange {
  start: string
  end: string
}

export interface ConformWeekPickerProps
  extends Omit<WeekPickerProps, "value" | "defaultValue" | "onChange" | "className" | "autoFocus"> {
  /**
   * A week bound to an object form value with `start` and `end` ISO strings —
   * the first and last day of the week. Validate it with
   * `v.object({ start: …, end: … })`.
   */
  field: FieldMetadata<ConformWeekRange>
  label?: string
  description?: string
  className?: string
}

/** Parse an ISO `YYYY-MM-DD` string into a CalendarDate; null for empty/invalid. */
function toCalendarDate(value: unknown): CalendarDate | null {
  if (typeof value !== "string" || value === "") return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/** Read the control payload as a week, or null while it is incomplete. */
function toWeekRange(payload: ConformWeekRange | null | undefined): WeekRange | null {
  const start = toCalendarDate(payload?.start)
  const end = toCalendarDate(payload?.end)
  return start && end ? { start, end } : null
}

/**
 * ConformWeekPicker — the Week Picker wired to Conform.
 *
 * Binds a week to a Conform field through a registered hidden `<fieldset>`,
 * which renders one hidden input per part: `<name>.start` and `<name>.end`,
 * both ISO `YYYY-MM-DD` — the first and last day of the selected week. The
 * picker is a react-stately ListBox with no `name` and no form control of its
 * own, so the fieldset is the whole form value, exactly as in
 * `conform-range-calendar`.
 *
 * Two dates rather than a single `YYYY-Www` token, and that is the decision
 * this component is really about. An ISO week token is ambiguous about the
 * year it belongs to — the days of week 1 straddle January — and week 53 exists
 * in some years and not others, so `2026-W53` is a value a server has to
 * validate before it can trust it. Week Picker itself already made that call:
 * it displays the ISO number and emits the range. A start/end pair is what the
 * server was going to compute anyway, it compares and sorts as plain strings,
 * and it makes the locale's week start — which is what decides where the week
 * begins in the first place — a fact on the wire instead of a fact the server
 * has to guess. Read the number back with the same `isoWeekNumber` shape Week
 * Picker uses if you need to display it.
 *
 * The range is always a whole week: the picker never emits a partial one, so
 * there is no half-selected state for the control to carry, unlike
 * `conform-range-calendar` between the two clicks.
 *
 * The registered fieldset is hidden by CSS rather than by the `hidden`
 * attribute, and carries no React `value` prop; both are silent when broken —
 * see `conform-time-field` for what each failure looks like.
 */
export function ConformWeekPicker({
  field,
  label,
  description,
  className,
  ...props
}: ConformWeekPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const control = useControl<ConformWeekRange, ConformWeekRange>({
    defaultValue: (field.initialValue as ConformWeekRange | undefined) ?? undefined,
    parse: (payload) => {
      if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null
      const { start, end } = payload as Record<string, unknown>
      return {
        start: typeof start === "string" ? start : "",
        end: typeof end === "string" ? end : "",
      }
    },
    // Conform focuses the first errored field after a failed submit; that is
    // the registered control, which nobody can see — hand it to the visible one.
    // The container below holds only the picker: the fieldset's own inputs are
    // ordinary focusable inputs and would otherwise answer first.
    onFocus() {
      focusFirstControl(pickerRef.current)
    },
  })

  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  return (
    <Field className={cn("flex w-fit flex-col gap-1.5", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}
        </Label>
      )}

      <BaseControl
        type="fieldset"
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue}
        hidden={false}
        tabIndex={-1}
        className="sr-only"
      />

      <div ref={pickerRef}>
        <WeekPicker
          {...props}
          value={toWeekRange(control.payload)}
          onChange={(week) =>
            control.change({ start: week.start.toString(), end: week.end.toString() })
          }
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
