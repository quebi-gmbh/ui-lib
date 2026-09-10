"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { cn } from "@/lib/utils"
import { DaySchedule, type DayScheduleProps, type DaySpan } from "@/components/day-schedule"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"

export interface ConformDayScheduleProps
  extends Omit<DayScheduleProps, "spans" | "defaultSpans" | "onSpansChange"> {
  /**
   * A weekly schedule bound to a form value. The spans are an array, so they
   * are submitted as a JSON string through a registered hidden input and the
   * schema parses that JSON back into spans — hence the wire-or-parsed union,
   * the same shape `conform-date-field` and `conform-number-field` use.
   */
  field: FieldMetadata<string | DaySpan[]>
  label?: string
  description?: string
  /** Used when the field has no initial value. */
  defaultSpans?: DaySpan[]
}

/** Parse a serialized span list, tolerating an absent or malformed payload. */
function parseSpans(value: string | undefined, fallback: DaySpan[]): DaySpan[] {
  if (typeof value !== "string" || value.length === 0) return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as DaySpan[]) : fallback
  } catch {
    return fallback
  }
}

/**
 * ConformDaySchedule — DaySchedule wired to Conform.
 *
 * Binds a Conform field to the quebi DaySchedule through a registered hidden
 * input carrying the spans as JSON. DaySchedule is a drag-to-select grid with
 * no native form value of its own, so that input is the whole submitted value.
 *
 * The spans live in Conform's state rather than in `useState`, which is what
 * makes them survive a failed submit and snap back on a form reset — a second
 * copy in component state disagrees with the form the moment either happens.
 */
export function ConformDaySchedule({
  field,
  label,
  description,
  defaultSpans = [],
  className,
  ...props
}: ConformDayScheduleProps) {
  const control = useControl({
    defaultValue: JSON.stringify(parseSpans(field.initialValue as string | undefined, defaultSpans)),
  })
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const spans = parseSpans(control.value, defaultSpans)

  return (
    <Field className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label className={cn("text-sm", hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}

      <BaseControl
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue ?? ""}
      />

      <div
        className={cn(
          "rounded-quebi-md border p-4 transition-colors duration-150",
          hasErrors ? "border-red-500" : "border-quebi-line/10",
        )}
      >
        <DaySchedule
          {...props}
          spans={spans}
          onSpansChange={(next) => control.change(JSON.stringify(next))}
          aria-invalid={hasErrors || undefined}
          aria-describedby={describedBy(
            hasErrors && field.errorId,
            description && field.descriptionId,
          )}
        />
      </div>

      {/* These ids are ours to set: DaySchedule is not a react-aria field, so
          nothing generates them and the aria-describedby above is their only
          reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
