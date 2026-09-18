import {
  type CalendarDate,
  startOfWeek,
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
import { WeekView } from "@/components/week-view"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Day View. */
const TIME_ZONE = "Europe/Berlin"

/**
 * The locale the fixture builds its week from. The *view* takes its locale from
 * the nearest I18nProvider; this one is only here so the sample events land on
 * the days this gallery shows. Change it to yours when you copy the file.
 */
const FIXTURE_LOCALE = "de-DE"

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

const CALENDARS: CalendarSource[] = [
  { id: "me", name: "My calendar", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
  { id: "ops", name: "Ops", color: "brand" },
]

/** Monday of the current week, or whatever the locale calls the first day. */
const weekStart = () => startOfWeek(today(TIME_ZONE), FIXTURE_LOCALE)

function week(start: CalendarDate): CalendarEvent[] {
  const day = (offset: number) => start.add({ days: offset })
  return [
    { id: "standup-1", title: "Standup", start: at(day(0), 9), end: at(day(0), 9, 15), calendarId: "team" },
    {
      id: "planning",
      title: "Planning",
      start: at(day(0), 10),
      end: at(day(0), 12),
      calendarId: "team",
      location: "Room 2",
    },
    { id: "focus-1", title: "Focus", start: at(day(0), 11), end: at(day(0), 13), calendarId: "me" },
    { id: "standup-2", title: "Standup", start: at(day(1), 9), end: at(day(1), 9, 15), calendarId: "team" },
    { id: "1-1", title: "1:1 with Ada", start: at(day(1), 14), end: at(day(1), 14, 30), calendarId: "me" },
    {
      id: "deploy",
      title: "Deploy window",
      start: at(day(2), 16),
      end: at(day(2), 18),
      calendarId: "ops",
    },
    { id: "design", title: "Design review", start: at(day(3), 10), end: at(day(3), 11, 30), calendarId: "team" },
    { id: "focus-2", title: "Focus", start: at(day(3), 10, 30), end: at(day(3), 12), calendarId: "me" },
    { id: "retro", title: "Retro", start: at(day(4), 15), end: at(day(4), 16), calendarId: "team" },
    {
      id: "oncall",
      title: "On call",
      start: at(day(4), 22),
      end: at(day(5), 6),
      calendarId: "ops",
    },
  ]
}

const DefaultWeek = () => {
  const start = weekStart()
  return (
    <WeekView
      events={week(start)}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={20}
      height={440}
    />
  )
}

const WorkWeek = () => {
  const start = weekStart()
  return (
    <div className="flex w-full flex-col gap-3">
      <CalendarLegend calendars={CALENDARS} />
      <WeekView
        events={week(start)}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        visibleDays={5}
        startHour={8}
        endHour={19}
        height={420}
      />
    </div>
  )
}

const BusyAllDayBand = () => {
  const start = weekStart()
  const bands: CalendarEvent[] = [
    {
      id: "conference",
      title: "Conference",
      start: at(start, 0),
      end: at(start.add({ days: 3 }), 0),
      allDay: true,
      calendarId: "team",
    },
    {
      id: "release",
      title: "Release freeze",
      start: at(start.add({ days: 1 }), 0),
      end: at(start.add({ days: 5 }), 0),
      allDay: true,
      calendarId: "ops",
    },
    {
      id: "holiday",
      title: "Public holiday",
      start: at(start.add({ days: 2 }), 0),
      end: at(start.add({ days: 3 }), 0),
      allDay: true,
      calendarId: "me",
    },
    {
      id: "training",
      title: "Training",
      start: at(start.add({ days: 2 }), 0),
      end: at(start.add({ days: 3 }), 0),
      allDay: true,
      calendarId: "team",
    },
  ]

  return (
    <WeekView
      events={[...week(start).slice(0, 4), ...bands]}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={14}
      maxAllDayLanes={2}
      height={320}
    />
  )
}

const WithDayReadout = () => {
  const start = weekStart()
  const events = week(start)
  const [clicked, setClicked] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <WeekView
        events={events}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        startHour={9}
        endHour={18}
        height={380}
        onEventClick={(event) => setClicked(event.title)}
      />
      <p className="text-quebi-fg-muted text-sm">
        {clicked ? `Opened: ${clicked}` : "Click an event — onEventClick hands you the whole event."}
      </p>
    </div>
  )
}

export const weekViewExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Seven days on one axis. The week starts where the locale says it does, and today's column carries the now-marker.",
    render: () => <DefaultWeek />,
  },
  {
    title: "Work week",
    description:
      "visibleDays={5} cuts the week to its working days. The chevrons still step a whole week, so the view cannot drift onto a Saturday.",
    render: () => <WorkWeek />,
  },
  {
    title: "All-day band and overflow",
    description:
      "Multi-day events stack into lanes above the grid. With more lanes than maxAllDayLanes allows, the last row becomes a \"+N more\" — and a band that would not fit on every day it covers is folded away whole rather than cut short.",
    render: () => <BusyAllDayBand />,
  },
  {
    title: "Click handler",
    description:
      "onEventClick fires on every activation and receives the event object you passed in, so you can open your own detail panel from it.",
    render: () => <WithDayReadout />,
  },
]
