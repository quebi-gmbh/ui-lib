"use client"

import { useState } from "react"
import type { FieldMetadata } from "@conform-to/react"
import { cn } from "@/lib/utils"
import { DaySchedule, type DaySpan, type DayScheduleProps } from "@/components/day-schedule"
import { Label } from "@/components/field"

/**
 * ConformDaySchedule — DaySchedule wired to Conform.
 *
 * The schedule's value is an array of spans, so it is submitted as a JSON
 * string through a hidden input named after the field. Validate it with a
 * valibot schema that parses the JSON (see the example), and the usual
 * name/default/required/errors are read off the field metadata.
 */

interface ConformDayScheduleProps
  extends Omit<DayScheduleProps, "spans" | "defaultSpans" | "onSpansChange"> {
  // Only name/initialValue/required/errors are read off the metadata; the
  // serialized value is a JSON string regardless of the schema's output type.
  field: FieldMetadata<any, any, string[]>
  label?: string
  /** Used when the field has no initial value. */
  defaultSpans?: DaySpan[]
}

/** Parse the field's initial value, tolerating an absent or malformed payload. */
function parseInitialSpans(initialValue: unknown, fallback: DaySpan[]): DaySpan[] {
  if (typeof initialValue !== "string" || initialValue.length === 0) return fallback
  try {
    const parsed = JSON.parse(initialValue)
    return Array.isArray(parsed) ? (parsed as DaySpan[]) : fallback
  } catch {
    return fallback
  }
}

export function ConformDaySchedule({
  field,
  label,
  defaultSpans = [],
  className,
  ...props
}: ConformDayScheduleProps) {
  const [spans, setSpans] = useState<DaySpan[]>(() =>
    parseInitialSpans(field.initialValue, defaultSpans),
  )
  const hasErrors = !field.valid && !!field.errors

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={field.id} className="text-sm text-quebi-fg">
          {label}
          {field.required && <span className="ml-0.5 text-quebi-brand">*</span>}
        </Label>
      )}

      {/* The submitted value. Kept in sync with the interactive schedule below. */}
      <input type="hidden" id={field.id} name={field.name} value={JSON.stringify(spans)} />

      <div
        className={cn(
          "rounded-quebi-md border p-4 transition-colors duration-150",
          hasErrors ? "border-red-500" : "border-quebi-line/10",
        )}
      >
        <DaySchedule
          {...props}
          spans={spans}
          onSpansChange={setSpans}
          aria-invalid={hasErrors || undefined}
          aria-describedby={hasErrors ? field.errorId : undefined}
          className={className}
        />
      </div>

      {hasErrors && (
        <p id={field.errorId} className="text-sm text-red-500">
          {field.errors?.join(", ")}
        </p>
      )}
    </div>
  )
}
