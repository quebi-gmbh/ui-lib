import { type CalendarDate, Time, toCalendarDateTime, toZoned, today } from "@internationalized/date"
import { useState } from "react"
import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { CalendarTimeline } from "@/components/calendar-timeline"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Day View. */
const TIME_ZONE = "Europe/Berlin"

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

/**
 * The rows. Colours are assigned in the palette's own order — that order is what
 * keeps adjacent rows distinguishable to a colour-blind reader, so take the
 * slots from the top rather than picking favourites.
 */
const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue", description: "12 seats · 4F" },
  { id: "borealis", name: "Borealis", color: "orange", description: "8 seats · 4F" },
  { id: "cosmos", name: "Cosmos", color: "brand", description: "20 seats · 3F" },
  { id: "delta", name: "Delta", color: "amber", description: "6 seats · 3F" },
  { id: "echo", name: "Echo", color: "pink", description: "4 seats · 2F" },
]

const PEOPLE: CalendarSource[] = [
  { id: "ada", name: "Ada Lovelace", color: "blue", description: "Engineering" },
  { id: "grace", name: "Grace Hopper", color: "orange", description: "Engineering" },
  { id: "katherine", name: "Katherine Johnson", color: "brand", description: "Research" },
]

function bookings(day: CalendarDate): CalendarEvent[] {
  return [
    { id: "b1", title: "Planning", start: at(day, 9), end: at(day, 11), calendarId: "aurora" },
    { id: "b2", title: "Design review", start: at(day, 13), end: at(day, 14, 30), calendarId: "aurora" },
    { id: "b3", title: "1:1", start: at(day, 10), end: at(day, 10, 30), calendarId: "borealis" },
    { id: "b4", title: "Interview", start: at(day, 11), end: at(day, 12), calendarId: "borealis" },
    { id: "b5", title: "All hands", start: at(day, 15), end: at(day, 16, 30), calendarId: "cosmos" },
    { id: "b6", title: "Workshop", start: at(day, 9, 30), end: at(day, 12, 30), calendarId: "cosmos" },
    { id: "b7", title: "Standup", start: at(day, 9), end: at(day, 9, 15), calendarId: "delta" },
    { id: "b8", title: "Pairing", start: at(day, 14), end: at(day, 17), calendarId: "delta" },
  ]
}

const Rooms = () => {
  const day = today(TIME_ZONE)
  return <CalendarTimeline calendars={ROOMS} events={bookings(day)} timeZone={TIME_ZONE} />
}

const DoubleBooked = () => {
  const day = today(TIME_ZONE)
  const clash: CalendarEvent[] = [
    ...bookings(day),
    { id: "clash-1", title: "Board call", start: at(day, 10), end: at(day, 11, 30), calendarId: "aurora" },
    { id: "clash-2", title: "Vendor demo", start: at(day, 10, 30), end: at(day, 12), calendarId: "aurora" },
  ]
  return <CalendarTimeline calendars={ROOMS.slice(0, 3)} events={clash} timeZone={TIME_ZONE} />
}

const PeopleWithLeave = () => {
  const day = today(TIME_ZONE)
  const events: CalendarEvent[] = [
    { id: "p1", title: "Deep work", start: at(day, 9), end: at(day, 12), calendarId: "ada" },
    { id: "p2", title: "Review", start: at(day, 14), end: at(day, 15), calendarId: "ada" },
    { id: "p3", title: "Standup", start: at(day, 9), end: at(day, 9, 15), calendarId: "grace" },
    { id: "p4", title: "Interviews", start: at(day, 10), end: at(day, 13), calendarId: "grace" },
    {
      id: "p5",
      title: "Annual leave",
      start: at(day, 0),
      end: at(day.add({ days: 1 }), 0),
      allDay: true,
      calendarId: "katherine",
    },
  ]
  return (
    <CalendarTimeline
      calendars={PEOPLE}
      events={events}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={18}
      hourWidth={88}
    />
  )
}

const WithSelection = () => {
  const day = today(TIME_ZONE)
  const events = bookings(day)
  const [selected, setSelected] = useState<string | null>(null)
  const current = events.find((event) => event.id === selected)

  return (
    <div className="flex w-full flex-col gap-3">
      <CalendarTimeline
        calendars={ROOMS.slice(0, 4)}
        events={events}
        timeZone={TIME_ZONE}
        startHour={8}
        endHour={18}
        selectedEventId={selected}
        onSelectionChange={setSelected}
      />
      <p className="text-quebi-fg-muted text-sm">
        {current ? `Selected: ${current.title}` : "Click a bar — the same selection contract as the grid views."}
      </p>
    </div>
  )
}

export const calendarTimelineExamples: ComponentExample[] = [
  {
    title: "Rooms",
    description:
      "One row per room, time running left to right. The name column stays put while the axis scrolls, so the colour is never the only thing identifying a row.",
    render: () => <Rooms />,
  },
  {
    title: "Double booking",
    description:
      "Overlapping bookings stack into lanes and the row grows to hold them. A clash is therefore visible rather than hidden behind whichever bar happened to render last.",
    render: () => <DoubleBooked />,
  },
  {
    title: "People, and a whole day off",
    description:
      "The rows are whatever you call a calendar. An all-day event has no position on a time axis, so it is drawn across the whole visible window — which is what it means.",
    render: () => <PeopleWithLeave />,
  },
  {
    title: "Selection",
    description:
      "selectedEventId and onSelectionChange behave exactly as they do in Day, Week and Month — one event model, one selection contract, four views.",
    render: () => <WithSelection />,
  },
]
