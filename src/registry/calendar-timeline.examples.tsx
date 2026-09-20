import {
  type CalendarDate,
  getDayOfWeek,
  parseDate,
  Time,
  toCalendarDateTime,
  toZoned,
  today,
} from "@internationalized/date"
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

/**
 * Monday, 21 September 2026 — pinned, like the time zone above.
 *
 * The span examples cannot build their fixtures from `today()` the way the
 * single-day ones do: a thirty-day plan reads as a plan because the leave, the
 * offsite and the release land on particular days of particular weeks, and a
 * range that starts on whatever day you opened the page puts the weekend
 * somewhere different every time. Pinning also means the copy of this file that
 * an agent pulls through `/api/components/calendar-timeline.json` draws the same
 * picture as the gallery does.
 */
const SPAN_START = parseDate("2026-09-21")

/** `on(1, 14, 30)` — 14:30 on the second day of the span. */
const on = (offset: number, hour: number, minute = 0) =>
  at(SPAN_START.add({ days: offset }), hour, minute)

const SPRINT: CalendarEvent[] = [
  { id: "s1", title: "Sprint planning", start: on(0, 9), end: on(0, 11), calendarId: "aurora" },
  { id: "s2", title: "Standup", start: on(0, 9, 30), end: on(0, 9, 45), calendarId: "borealis" },
  { id: "s3", title: "Design review", start: on(0, 14), end: on(0, 15, 30), calendarId: "cosmos" },
  { id: "s4", title: "Standup", start: on(1, 9, 30), end: on(1, 9, 45), calendarId: "borealis" },
  { id: "s5", title: "Pairing", start: on(1, 10), end: on(1, 13), calendarId: "aurora" },
  { id: "s6", title: "Customer call", start: on(1, 16), end: on(1, 17), calendarId: "cosmos" },
  // Through midnight, and back inside the window on the far side of it: one
  // segment on each day, with the night the axis does not draw between them.
  { id: "s7", title: "Release window", start: on(1, 20), end: on(2, 7), calendarId: "cosmos" },
  { id: "s8", title: "Standup", start: on(2, 9, 30), end: on(2, 9, 45), calendarId: "borealis" },
  { id: "s9", title: "Retro", start: on(2, 15), end: on(2, 16, 30), calendarId: "aurora" },
]

const ThreeDays = () => (
  <CalendarTimeline
    calendars={ROOMS.slice(0, 3)}
    events={SPRINT}
    defaultDate={SPAN_START}
    days={3}
    timeZone={TIME_ZONE}
  />
)

const WEEK: CalendarEvent[] = [
  { id: "w1", title: "Deep work", start: on(0, 9), end: on(0, 12), calendarId: "ada" },
  { id: "w2", title: "Standup", start: on(0, 9, 30), end: on(0, 9, 45), calendarId: "grace" },
  { id: "w3", title: "Interviews", start: on(1, 10), end: on(1, 13), calendarId: "grace" },
  { id: "w4", title: "Pairing", start: on(1, 14), end: on(1, 17), calendarId: "ada" },
  { id: "w5", title: "Standup", start: on(2, 9, 30), end: on(2, 9, 45), calendarId: "grace" },
  { id: "w6", title: "Architecture", start: on(3, 10), end: on(3, 12, 30), calendarId: "ada" },
  { id: "w7", title: "On call", start: on(3, 20), end: on(4, 8), calendarId: "grace" },
  { id: "w8", title: "Demo", start: on(4, 15), end: on(4, 16), calendarId: "ada" },
  {
    id: "w9",
    title: "Research offsite",
    start: at(SPAN_START.add({ days: 2 }), 0),
    end: at(SPAN_START.add({ days: 5 }), 0),
    allDay: true,
    calendarId: "katherine",
  },
]

const AWeek = () => (
  <CalendarTimeline
    calendars={PEOPLE}
    events={WEEK}
    defaultDate={SPAN_START}
    days={7}
    timeZone={TIME_ZONE}
    // Pinned for the same reason the dates are. Over a range the marker is
    // placed by the range and not by the anchor day, which is a thing you can
    // only see on a range whose middle is "now" — so this one says when now is.
    now={at(SPAN_START.add({ days: 2 }), 11, 30)}
  />
)

/**
 * A month of it. Deterministic on purpose — no clock, no die — because this is
 * a fixture that gets copied, and a plan that differs between two renders is not
 * a plan.
 */
function monthPlan(): CalendarEvent[] {
  const events: CalendarEvent[] = [
    {
      id: "q1",
      title: "Annual leave",
      start: at(SPAN_START.add({ days: 7 }), 0),
      end: at(SPAN_START.add({ days: 12 }), 0),
      allDay: true,
      calendarId: "katherine",
    },
    {
      id: "q2",
      title: "Parental leave",
      start: at(SPAN_START.add({ days: 18 }), 0),
      end: at(SPAN_START.add({ days: 25 }), 0),
      allDay: true,
      calendarId: "grace",
    },
    { id: "q3", title: "Kickoff", start: on(0, 10), end: on(0, 12), calendarId: "ada" },
    { id: "q4", title: "Architecture", start: on(3, 10), end: on(3, 13), calendarId: "ada" },
    { id: "q5", title: "Customer workshop", start: on(9, 9), end: on(9, 17), calendarId: "ada" },
    { id: "q6", title: "Interviews", start: on(14, 10), end: on(14, 16), calendarId: "grace" },
    { id: "q7", title: "Release", start: on(16, 14), end: on(16, 20), calendarId: "ada" },
    { id: "q8", title: "Retro", start: on(23, 15), end: on(23, 16, 30), calendarId: "katherine" },
    { id: "q9", title: "Planning", start: on(28, 9), end: on(28, 12), calendarId: "katherine" },
  ]

  // A quarter-hour standup every working day: thirty bars that are slivers at
  // eight pixels an hour, which is exactly the case task #164 gives a name and a
  // tooltip instead of leaving as a block of colour.
  for (let offset = 0; offset < 30; offset++) {
    const day = SPAN_START.add({ days: offset })
    // `getDayOfWeek` numbers the week for a locale; "en-US" pins 0 to Sunday so
    // the fixture does not move with the reader's. Going through
    // `day.toDate(TIME_ZONE).getDay()` instead reads the weekday in whatever
    // zone the *machine* is in — midnight in Berlin is the previous day in UTC,
    // which put the standups on Tuesday through Saturday on a UTC box.
    const weekday = getDayOfWeek(day, "en-US")
    if (weekday === 0 || weekday === 6) continue
    events.push({
      id: `q-standup-${offset}`,
      title: "Standup",
      start: at(day, 9, 30),
      end: at(day, 9, 45),
      calendarId: "grace",
    })
  }

  return events
}

const ThirtyDays = () => (
  <CalendarTimeline
    calendars={PEOPLE}
    events={monthPlan()}
    defaultDate={SPAN_START}
    days={30}
    timeZone={TIME_ZONE}
  />
)

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

const JumpToADay = () => {
  const [day, setDay] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <CalendarTimeline
      calendars={ROOMS.slice(0, 3)}
      events={bookings(day)}
      date={day}
      onDateChange={setDay}
      labelVariant="picker"
      timeZone={TIME_ZONE}
    />
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
    title: "Three days",
    description:
      "`days` widens the axis. Each day keeps its own startHour\u2013endHour window, so a longer span narrows every day rather than changing what a day means \u2014 and the chevrons page the whole span. The release window runs through midnight, so it is drawn as one segment per day: the hours between 22:00 and 06:00 are not on the axis, so the seam is the day boundary itself.",
    render: () => <ThreeDays />,
  },
  {
    title: "A week",
    description:
      "At 20px an hour the hour row degrades to three-hourly ticks on its own; the day row above it carries the dates. The offsite is one all-day band across the three days it covers, packed against the timed events rather than underneath them, and the now-marker sits where the pinned instant falls inside the range rather than on the day the range starts.",
    render: () => <AWeek />,
  },
  {
    title: "Thirty days",
    description:
      "A resource plan. The day is the unit you read at this width, so the hour row is dropped entirely and the day row is the axis. Every quarter-hour standup is a sliver by construction \u2014 hover one, or reach it with a screen reader: each bar carries its full name whether or not it has room to draw it.",
    render: () => <ThirtyDays />,
  },
  {
    title: "Selection",
    description:
      "selectedEventId and onSelectionChange behave exactly as they do in Day, Week and Month — one event model, one selection contract, four views.",
    render: () => <WithSelection />,
  },
  {
    title: "Jump to a day",
    description:
      "One chevron press is one day here, so a timeline is the view that most wants somewhere else to go. `labelVariant=\"picker\"` makes the date heading a button opening a calendar; the bookings are rebuilt for whichever day comes back.",
    render: () => <JumpToADay />,
  },
]
