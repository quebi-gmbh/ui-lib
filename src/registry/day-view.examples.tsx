import { type CalendarDate, Time, toCalendarDateTime, toZoned, today } from "@internationalized/date"
import { useState } from "react"
import {
  type CalendarEvent,
  CalendarLegend,
  type CalendarSource,
} from "@/components/calendar-shell"
import { DayView } from "@/components/day-view"
import type { ComponentExample } from "./types"

/**
 * The zone the grid is drawn in, pinned rather than read from the runtime: a
 * page rendered on a build machine and hydrated in a browser must agree about
 * which day it is.
 */
const TIME_ZONE = "Europe/Berlin"

/** `at(day, 9, 30)` — half past nine on `day`, in the zone above. */
const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

const CALENDARS: CalendarSource[] = [
  { id: "me", name: "My calendar", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
]

function agenda(day: CalendarDate): CalendarEvent[] {
  return [
    { id: "standup", title: "Standup", start: at(day, 9), end: at(day, 9, 15), calendarId: "team" },
    {
      id: "focus",
      title: "Focus block",
      start: at(day, 9, 30),
      end: at(day, 12),
      calendarId: "me",
      location: "Desk",
    },
    {
      id: "design",
      title: "Design review",
      start: at(day, 10),
      end: at(day, 11),
      calendarId: "team",
      location: "Room 2",
    },
    {
      id: "1-1",
      title: "1:1 with Ada",
      start: at(day, 10, 30),
      end: at(day, 11),
      calendarId: "team",
    },
    { id: "lunch", title: "Lunch", start: at(day, 12), end: at(day, 13), calendarId: "me" },
    {
      id: "retro",
      title: "Retro",
      start: at(day, 15),
      end: at(day, 16, 30),
      calendarId: "team",
      location: "Room 4",
    },
  ]
}

const DefaultDay = () => {
  const day = today(TIME_ZONE)
  return <DayView events={agenda(day)} calendars={CALENDARS} timeZone={TIME_ZONE} />
}

const WorkingHours = () => {
  const day = today(TIME_ZONE)
  return (
    <DayView
      events={agenda(day)}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={18}
      hourHeight={56}
      height={420}
    />
  )
}

const WithLegend = () => {
  const day = today(TIME_ZONE)
  return (
    <div className="flex w-full flex-col gap-3">
      <CalendarLegend calendars={CALENDARS} />
      <DayView events={agenda(day)} calendars={CALENDARS} timeZone={TIME_ZONE} startHour={8} endHour={18} />
    </div>
  )
}

const AllDayAndOvernight = () => {
  const day = today(TIME_ZONE)
  const events: CalendarEvent[] = [
    ...agenda(day).slice(0, 3),
    {
      id: "conference",
      title: "Conference",
      start: at(day, 0),
      end: at(day.add({ days: 1 }), 0),
      allDay: true,
      calendarId: "team",
    },
    {
      id: "oncall",
      title: "On call",
      start: at(day, 22),
      end: at(day.add({ days: 1 }), 2),
      calendarId: "me",
    },
  ]
  return (
    <DayView events={events} calendars={CALENDARS} timeZone={TIME_ZONE} startHour={8} endHour={24} />
  )
}

const WithSelection = () => {
  const day = today(TIME_ZONE)
  const events = agenda(day)
  const [selected, setSelected] = useState<string | null>(null)
  const current = events.find((event) => event.id === selected)

  return (
    <div className="flex w-full flex-col gap-3">
      <DayView
        events={events}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        startHour={8}
        endHour={18}
        selectedEventId={selected}
        onSelectionChange={setSelected}
      />
      <p className="text-quebi-fg-muted text-sm">
        {current ? `Selected: ${current.title}` : "Click an event — it reports through onSelectionChange."}
      </p>
    </div>
  )
}

export const dayViewExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "One day, with the toolbar above it. Overlapping meetings are packed into side-by-side columns, and a block widens into any column free beside it.",
    render: () => <DefaultDay />,
  },
  {
    title: "Working hours",
    description:
      "startHour and endHour cut the axis down to the part of the day anyone looks at; hourHeight decides how much room an hour gets.",
    render: () => <WorkingHours />,
  },
  {
    title: "Two calendars",
    description:
      "Events take their colour from the calendar that owns them. CalendarLegend names the hues, so colour is never the only thing telling them apart.",
    render: () => <WithLegend />,
  },
  {
    title: "All-day and overnight",
    description:
      "An all-day event sits in the band above the grid. An overnight shift stays on the grid and is cut at midnight — its block loses the rounded edge where it continues.",
    render: () => <AllDayAndOvernight />,
  },
  {
    title: "Selection",
    description:
      "selectedEventId and onSelectionChange make the selection yours; clicking the selected event again clears it. onEventClick fires on every activation if you only want the click.",
    render: () => <WithSelection />,
  },
]
