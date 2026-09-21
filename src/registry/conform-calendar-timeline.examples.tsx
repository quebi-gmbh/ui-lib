import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import {
  type CalendarDate,
  parseZonedDateTime,
  Time,
  toCalendarDateTime,
  toZoned,
  today,
} from "@internationalized/date"
import * as v from "valibot"
import { Button } from "@/components/button"
import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { ConformCalendarTimeline } from "@/components/conform-calendar-timeline"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Day View. */
const TIME_ZONE = "Europe/Berlin"

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue", description: "12 seats · 4F" },
  { id: "borealis", name: "Borealis", color: "orange", description: "8 seats · 4F" },
  { id: "cosmos", name: "Cosmos", color: "brand", description: "20 seats · 3F" },
]

function bookings(day: CalendarDate): CalendarEvent[] {
  return [
    { id: "b1", title: "Planning", start: at(day, 9), end: at(day, 11), calendarId: "aurora" },
    { id: "b2", title: "Design review", start: at(day, 13), end: at(day, 15), calendarId: "aurora" },
    { id: "b3", title: "Interview", start: at(day, 10), end: at(day, 12), calendarId: "borealis" },
    { id: "b4", title: "Workshop", start: at(day, 9, 30), end: at(day, 12, 30), calendarId: "cosmos" },
  ]
}

/** The hour a wire instant falls on, or 0 if the payload is not one. */
function endsAt(value: string): number {
  try {
    const instant = parseZonedDateTime(value)
    return instant.hour + instant.minute / 60
  } catch {
    return 0
  }
}

const bookingSchema = v.object({
  id: v.string(),
  title: v.string(),
  start: v.string(),
  end: v.string(),
  calendarId: v.optional(v.string()),
})

const schema = v.object({
  // The timeline submits a JSON string, so parse it before validating the
  // bookings themselves. A malformed payload fails here rather than throwing.
  bookings: v.pipe(
    v.string(),
    v.transform((value) => {
      try {
        return JSON.parse(value) as unknown
      } catch {
        return null
      }
    }),
    v.check((value) => value !== null, "Could not read the bookings"),
    v.array(bookingSchema),
    v.check(
      (entries) => entries.every((entry) => endsAt(entry.end) <= 17),
      "Every room has to be free again by 17:00",
    ),
  ),
})

const RoomPlanForm = () => {
  const day = today(TIME_ZONE)
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex w-full flex-col gap-4" noValidate>
      <ConformCalendarTimeline
        field={fields.bookings}
        label="Room plan"
        description="Drag a booking to another time or another room, or pull either end to change how long it runs. Arrow keys do the same; Shift with them changes the length."
        defaultEvents={bookings(day)}
        calendars={ROOMS}
        timeZone={TIME_ZONE}
        startHour={8}
        endHour={18}
      />
      <Button type="submit" size="sm" className="self-start">
        Save the plan
      </Button>
    </form>
  )
}

const LockedRowForm = () => {
  const day = today(TIME_ZONE)
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex w-full flex-col gap-4" noValidate>
      <ConformCalendarTimeline
        field={fields.bookings}
        label="Room plan"
        description="The interview is someone else's booking: it still selects, and it does not move."
        defaultEvents={bookings(day)}
        calendars={ROOMS}
        timeZone={TIME_ZONE}
        startHour={8}
        endHour={18}
        isEventEditable={(event) => event.id !== "b3"}
      />
      <Button type="submit" size="sm" className="self-start">
        Save the plan
      </Button>
    </form>
  )
}

export const conformCalendarTimelineExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "The whole plan submits as JSON. Drag a booking past 17:00 and submit to see the validation error — and note that the plan you dragged is still there afterwards, because the events live in Conform's state rather than in a second copy of them.",
    render: () => <RoomPlanForm />,
  },
  {
    title: "Not every booking is yours",
    description:
      "`isEventEditable` is a predicate, so editability can be a property of the event. A bar it refuses keeps the press target it always had — it selects, it just does not move.",
    render: () => <LockedRowForm />,
  },
]
