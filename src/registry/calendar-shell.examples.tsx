import { type CalendarDate, Time, toCalendarDateTime, toZoned, today } from "@internationalized/date"
import { useState } from "react"
import {
  type CalendarEvent,
  CalendarLegend,
  CalendarShell,
  type CalendarSource,
} from "@/components/calendar-shell"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the component's header. */
const TIME_ZONE = "Europe/Berlin"

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

const CALENDARS: CalendarSource[] = [
  { id: "me", name: "My calendar", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
]

const OneDay = () => {
  const day = today(TIME_ZONE)
  const events: CalendarEvent[] = [
    { id: "standup", title: "Standup", start: at(day, 9), end: at(day, 9, 15), calendarId: "team" },
    { id: "focus", title: "Focus", start: at(day, 9, 30), end: at(day, 12), calendarId: "me" },
    { id: "lunch", title: "Lunch", start: at(day, 12), end: at(day, 13), calendarId: "me" },
    { id: "review", title: "Review", start: at(day, 14), end: at(day, 15, 30), calendarId: "team" },
  ]
  return (
    <CalendarShell
      days={[day]}
      events={events}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={18}
      height={400}
    />
  )
}

const Packing = () => {
  const day = today(TIME_ZONE)
  // The four shapes the packing pass has to get right, on one morning: a long
  // containing block, two meetings inside it that share a column, a back-to-back
  // pair that must NOT split a column, and a point in time.
  const events: CalendarEvent[] = [
    { id: "long", title: "All morning", start: at(day, 9), end: at(day, 13), calendarId: "me" },
    { id: "a", title: "Design", start: at(day, 9, 30), end: at(day, 10, 30), calendarId: "team" },
    { id: "b", title: "Sync", start: at(day, 11), end: at(day, 12), calendarId: "team" },
    { id: "c", title: "Handover", start: at(day, 13), end: at(day, 14), calendarId: "team" },
    { id: "d", title: "Next up", start: at(day, 14), end: at(day, 15), calendarId: "team" },
    { id: "point", title: "Deploy", start: at(day, 15), end: at(day, 15), calendarId: "me" },
  ]
  return (
    <CalendarShell
      days={[day]}
      events={events}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={17}
      hourHeight={56}
      height={420}
    />
  )
}

const ThreeDays = () => {
  const first = today(TIME_ZONE)
  const second = first.add({ days: 1 })
  const third = first.add({ days: 2 })
  const events: CalendarEvent[] = [
    { id: "t1", title: "Kickoff", start: at(first, 10), end: at(first, 11), calendarId: "team" },
    { id: "t2", title: "Workshop", start: at(second, 9), end: at(second, 12), calendarId: "team" },
    { id: "t3", title: "Focus", start: at(third, 13), end: at(third, 16), calendarId: "me" },
    {
      id: "t4",
      title: "Overnight run",
      start: at(second, 22),
      end: at(third, 3),
      calendarId: "me",
    },
  ]
  return (
    <div className="flex w-full flex-col gap-3">
      <CalendarLegend calendars={CALENDARS} />
      <CalendarShell
        days={[first, second, third]}
        events={events}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        height={420}
      />
    </div>
  )
}

const Bare = () => {
  const day = today(TIME_ZONE)
  const events: CalendarEvent[] = [
    { id: "m1", title: "Interview", start: at(day, 10), end: at(day, 11), calendarId: "team" },
    { id: "m2", title: "Debrief", start: at(day, 11), end: at(day, 11, 30), calendarId: "team" },
  ]
  const [selected, setSelected] = useState<string | null>("m1")

  return (
    <div className="flex w-full flex-col gap-3">
      <CalendarShell
        days={[day]}
        events={events}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        startHour={9}
        endHour={13}
        hourHeight={64}
        height={300}
        showDayHeaders={false}
        showAllDayRow={false}
        selectedEventId={selected}
        onSelectionChange={setSelected}
      />
      <p className="text-quebi-fg-muted text-sm">
        {selected ? `Selected: ${selected}` : "Nothing selected."}
      </p>
    </div>
  )
}

export const calendarShellExamples: ComponentExample[] = [
  {
    title: "One day",
    description:
      "The shell on its own, with no toolbar: hand it the days it should draw and it draws them. Day View and Week View are this component plus a date and a toolbar.",
    render: () => <OneDay />,
  },
  {
    title: "How overlaps pack",
    description:
      "A containing block keeps the leftmost column and widens wherever nothing sits beside it; back-to-back meetings share a column, because intervals are half-open; and a zero-length event is packed at the height it is actually drawn at, so it never hides under its neighbour.",
    render: () => <Packing />,
  },
  {
    title: "Several days, and one that crosses midnight",
    description:
      "Any run of days works — three, five, fourteen. An event running past midnight is cut into one block per day and loses the rounded edge at the seam, so the two halves read as one thing.",
    render: () => <ThreeDays />,
  },
  {
    title: "Stripped back",
    description:
      "showDayHeaders and showAllDayRow turn off the chrome for an embedded grid. Selection is controlled here, so the surrounding page decides what is highlighted.",
    render: () => <Bare />,
  },
]
