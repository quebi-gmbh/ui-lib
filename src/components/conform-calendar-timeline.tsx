"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { parseZonedDateTime, type ZonedDateTime } from "@internationalized/date"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/components/calendar-shell"
import { CalendarTimeline, type CalendarTimelineProps } from "@/components/calendar-timeline"
import {
  describedBy,
  Description,
  Field,
  FieldError,
  focusFirstControl,
  Label,
} from "@/components/field"

/**
 * An event as it survives JSON: the two instants as strings.
 *
 * `ZonedDateTime` is not a JSON value and `JSON.stringify` would reduce one to
 * `{}`, so the wire carries `start` and `end` in the round-tripping form
 * `@internationalized/date` prints — `2026-09-21T09:00+02:00[Europe/Berlin]` —
 * which keeps the zone rather than flattening it to UTC. This is the shape a
 * schema validating the submitted field will be handed, which is why it is
 * exported and why it is the parsed half of the field's union.
 */
export interface CalendarTimelineEvent extends Omit<CalendarEvent, "start" | "end"> {
  start: string
  end: string
}

export interface ConformCalendarTimelineProps
  extends Omit<CalendarTimelineProps<CalendarEvent>, "events" | "onEventChange" | "className"> {
  /**
   * The bookings bound to a form value. They are an array, so they are
   * submitted as a JSON string through a registered hidden input and the schema
   * parses that JSON back into events — hence the wire-or-parsed union, the
   * same shape `conform-day-schedule` and `conform-date-field` use.
   */
  field: FieldMetadata<string | CalendarTimelineEvent[]>
  label?: string
  description?: string
  /** Used when the field has no initial value. */
  defaultEvents?: CalendarEvent[]
  className?: string
}

/** One instant back from the wire, or null if it is not one. */
function parseInstant(value: unknown): ZonedDateTime | null {
  if (typeof value !== "string") return null
  try {
    return parseZonedDateTime(value)
  } catch {
    return null
  }
}

/** One event back from the wire, or null if it is missing the parts that make it one. */
function reviveEvent(entry: unknown): CalendarEvent | null {
  if (typeof entry !== "object" || entry === null) return null
  const record = entry as Partial<CalendarTimelineEvent>
  const start = parseInstant(record.start)
  const end = parseInstant(record.end)
  if (typeof record.id !== "string" || typeof record.title !== "string") return null
  if (!start || !end) return null
  return { ...record, id: record.id, title: record.title, start, end }
}

/**
 * Parse a serialized event list, tolerating a payload that is not one.
 *
 * Tolerant at two levels, deliberately. A value that is not JSON, or not an
 * array, falls back — the field may hold anything a user, a fixture or an older
 * release of your own app put in it, and a timeline that throws on render takes
 * the whole form down with it. An entry that is not an event is dropped and the
 * rest are kept, because the alternative is that one bad row silently discards
 * a day's editing. What decides whether the submitted value is *acceptable* is
 * the schema, which is the only place that question belongs.
 */
function parseEvents(value: string | undefined, fallback: CalendarEvent[]): CalendarEvent[] {
  if (typeof value !== "string" || value.length === 0) return fallback
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return fallback
  }
  if (!Array.isArray(parsed)) return fallback

  const events: CalendarEvent[] = []
  for (const entry of parsed) {
    const event = reviveEvent(entry)
    if (event) events.push(event)
  }
  return events
}

/** The events as the form will submit them. */
function serializeEvents(events: readonly CalendarEvent[]): string {
  return JSON.stringify(
    events.map((event) => ({
      ...event,
      start: event.start.toString(),
      end: event.end.toString(),
    })),
  )
}

/**
 * ConformCalendarTimeline — CalendarTimeline wired to Conform.
 *
 * Binds a Conform field to the quebi CalendarTimeline through a registered
 * hidden input carrying the whole event list as JSON. The timeline reports each
 * move and resize through `onEventChange` and never holds the events itself, so
 * this is the piece that owns them — and it keeps them in Conform's state
 * rather than in `useState`, which is what makes a plan survive a failed submit
 * and snap back on a form reset. A second copy in component state disagrees
 * with the form the moment either happens.
 *
 * Every event is editable unless `isEventEditable` says otherwise, since a
 * timeline in a form is there to be edited. The prop is passed straight through,
 * so a predicate can still freeze the bookings that are not the reader's.
 */
export function ConformCalendarTimeline({
  field,
  label,
  description,
  defaultEvents = [],
  isEventEditable = true,
  className,
  ...props
}: ConformCalendarTimelineProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const control = useControl({
    defaultValue: serializeEvents(
      parseEvents(field.initialValue as string | undefined, defaultEvents),
    ),
    // Conform focuses the first errored field after a failed submit; that is
    // the registered control, which nobody can see — hand it to the visible one.
    onFocus() {
      focusFirstControl(fieldRef.current)
    },
  })
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const events = parseEvents(control.value, defaultEvents)

  return (
    <Field ref={fieldRef} className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label className={cn("text-sm", hasErrors && "text-red-500")}>
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

      {/* biome-ignore lint/a11y/useSemanticElements: <fieldset> is the element for this role, and it is the wrong box here — it brings a UA border, padding and `min-inline-size: min-content` into a surface that already draws its own border and has to be exactly as wide as the timeline scrolling inside it. The role is what carries the description and the error to a control with no form element of its own, so dropping it would leave the aria-describedby below pointing at nothing. */}
      <div
        role="group"
        aria-label={label}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
        className={cn(
          "rounded-quebi-md border p-2 transition-colors duration-150",
          hasErrors ? "border-red-500" : "border-quebi-line/10",
        )}
      >
        <CalendarTimeline
          {...props}
          events={events}
          isEventEditable={isEventEditable}
          onEventChange={(event, next) => {
            control.change(
              serializeEvents(
                events.map((entry) =>
                  entry.id === event.id
                    ? {
                        ...entry,
                        start: next.start,
                        end: next.end,
                        calendarId: next.calendarId ?? entry.calendarId,
                      }
                    : entry,
                ),
              ),
            )
          }}
        />
      </div>

      {/* These ids are ours to set: CalendarTimeline is not a react-aria field,
          so nothing generates them and the aria-describedby above is their only
          reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
