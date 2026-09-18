import {
  type CalendarDate,
  startOfMonth,
  Time,
  toCalendarDateTime,
  toZoned,
  today,
} from "@internationalized/date"
import { useState } from "react"
import {
  type CalendarEvent,
  CalendarLegend,
  type CalendarSource,
} from "@/components/calendar-shell"
import { MonthView } from "@/components/month-view"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Day View. */
const TIME_ZONE = "Europe/Berlin"

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

const CALENDARS: CalendarSource[] = [
  { id: "me", name: "My calendar", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
  { id: "ops", name: "Ops", color: "brand" },
]

function month(first: CalendarDate): CalendarEvent[] {
  const day = (offset: number) => first.add({ days: offset })
  return [
    {
      id: "kickoff",
      title: "Kickoff",
      start: at(day(2), 10),
      end: at(day(2), 11, 30),
      calendarId: "team",
    },
    { id: "1-1", title: "1:1 with Ada", start: at(day(4), 14), end: at(day(4), 14, 30), calendarId: "me" },
    {
      id: "conference",
      title: "Conference",
      start: at(day(7), 0),
      end: at(day(10), 0),
      allDay: true,
      calendarId: "team",
    },
    { id: "review", title: "Design review", start: at(day(11), 9), end: at(day(11), 10), calendarId: "team" },
    {
      id: "freeze",
      title: "Release freeze",
      start: at(day(14), 0),
      end: at(day(19), 0),
      allDay: true,
      calendarId: "ops",
    },
    { id: "deploy", title: "Deploy", start: at(day(18), 16), end: at(day(18), 18), calendarId: "ops" },
    { id: "retro", title: "Retro", start: at(day(21), 15), end: at(day(21), 16), calendarId: "team" },
    {
      id: "offsite",
      title: "Offsite",
      start: at(day(24), 0),
      end: at(day(26), 0),
      allDay: true,
      calendarId: "me",
    },
  ]
}

const DefaultMonth = () => {
  const first = startOfMonth(today(TIME_ZONE))
  return <MonthView events={month(first)} calendars={CALENDARS} timeZone={TIME_ZONE} />
}

const WithLegend = () => {
  const first = startOfMonth(today(TIME_ZONE))
  return (
    <div className="flex w-full flex-col gap-3">
      <CalendarLegend calendars={CALENDARS} />
      <MonthView events={month(first)} calendars={CALENDARS} timeZone={TIME_ZONE} weekHeight={132} />
    </div>
  )
}

const Overflowing = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const busyDay = first.add({ days: 9 })
  const crowd: CalendarEvent[] = Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index}`,
    title: `Interview ${index + 1}`,
    start: at(busyDay, 9 + index),
    end: at(busyDay, 10 + index),
    calendarId: "team",
  }))

  return <MonthView events={[...month(first), ...crowd]} calendars={CALENDARS} timeZone={TIME_ZONE} weekHeight={110} />
}

const DrillDown = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const [note, setNote] = useState("Click a day number, an event, or a \"+N more\".")

  return (
    <div className="flex w-full flex-col gap-3">
      <MonthView
        events={month(first)}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        onDayClick={(day) => setNote(`Day pressed: ${day.toString()}`)}
        onEventClick={(event) => setNote(`Event pressed: ${event.title}`)}
        onMoreClick={(day, events) => setNote(`${events.length} events on ${day.toString()}`)}
      />
      <p className="text-quebi-fg-muted text-sm">{note}</p>
    </div>
  )
}

export const monthViewExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Whole weeks, no more rows than the month needs. A timed event is a dot, a time and a title; a multi-day one is a filled chip running across the days it covers.",
    render: () => <DefaultMonth />,
  },
  {
    title: "Taller rows",
    description:
      "weekHeight decides how many chips a cell holds before the overflow starts — the lane count is derived from it, not configured twice.",
    render: () => <WithLegend />,
  },
  {
    title: "\"+N more\" overflow",
    description:
      "A day with more events than lanes spends its last lane on the overflow link, so the link never covers an event that was drawn underneath it.",
    render: () => <Overflowing />,
  },
  {
    title: "Drilling down",
    description:
      "onDayClick, onEventClick and onMoreClick are the three ways out of a month grid — switch to the day view, open a detail panel, or list what a cell hid.",
    render: () => <DrillDown />,
  },
]
