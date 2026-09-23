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

/** The same month, moved by `offset` months and with ids of its own. */
function shifted(first: CalendarDate, offset: number): CalendarEvent[] {
  return month(first.add({ months: offset })).map((event) => ({
    ...event,
    id: `${event.id}@${offset}`,
  }))
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

/** A day nobody would want: twelve things, one of them the release freeze. */
const BUSY_DAY = [
  "Standup",
  "Design review",
  "1:1 with Ada",
  "Interview loop",
  "Lunch & learn",
  "Sprint planning",
  "Vendor call",
  "Budget sync",
  "Support triage",
  "Retro",
  "Deploy window",
  "On-call handover",
]

const OverflowPanel = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const busyDay = first.add({ days: 16 })
  const [selected, setSelected] = useState<string | null>(null)
  const crowd: CalendarEvent[] = BUSY_DAY.map((title, index) => ({
    id: `busy-${index}`,
    title,
    start: at(busyDay, 8 + index),
    end: at(busyDay, 9 + index),
    calendarId: index % 2 === 0 ? "me" : "team",
  }))

  return (
    <MonthView
      events={[...month(first), ...crowd]}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      selectedEventId={selected}
      onSelectionChange={setSelected}
    />
  )
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

const DragToMove = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const [events, setEvents] = useState<CalendarEvent[]>(() => month(first))
  const [moved, setMoved] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <MonthView
        events={events}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        weekHeight={124}
        // Movable is a question about the event, not about the view: the
        // release freeze is the one date here nobody gets to drag.
        isEventEditable={(event) => event.id !== "freeze"}
        // The view moves nothing. It reports the day the chip was dropped on,
        // and this is the state that decides whether it goes there — refuse the
        // change by not writing it, and the chip stays where it was.
        onEventChange={(event, next) => {
          setEvents((current) =>
            current.map((candidate) =>
              candidate.id === event.id
                ? { ...candidate, start: next.start, end: next.end }
                : candidate,
            ),
          )
          setMoved(event.title)
        }}
      />
      <p className="text-quebi-fg-muted text-sm">
        {moved
          ? `Moved: ${moved}`
          : "Drag a chip onto another day — or tab to one and use the arrow keys."}
      </p>
    </div>
  )
}

/**
 * Two months beside each other — the shape a booking or planning calendar takes,
 * because "is there room the week after next" is a question that straddles the
 * 30th. Each grid dims its own leading and trailing days: a day outside
 * September is outside it whatever is drawn to the right of it.
 */
const TwoMonths = () => {
  const first = startOfMonth(today(TIME_ZONE))
  return (
    <MonthView
      range={{ months: 2 }}
      events={[...month(first), ...shifted(first, 1)]}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      weekHeight={104}
    />
  )
}

/**
 * Eight weeks, anchored on a week rather than on a month: the heading is a week
 * picker, the chevrons slide the strip one week at a time, and no day is
 * dimmed because nothing in a strip is outside it. The only seam left is where
 * the months change, and the 1st says so itself.
 */
const RollingWeeks = () => {
  const first = startOfMonth(today(TIME_ZONE))
  return (
    <MonthView
      range={{ weeks: 8 }}
      events={[...month(first), ...shifted(first, 1)]}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      weekHeight={96}
    />
  )
}

/**
 * The same two months through a window, with the months either side showing a
 * slice of themselves. How many are in the window is the reader's to change,
 * which is the one thing about a calendar's density a reader answers better
 * than the page does.
 */
const MonthCarousel = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const [shown, setShown] = useState(2)
  return (
    <div className="flex w-full flex-col gap-3">
      <MonthView
        range={{ months: 2, carousel: true }}
        events={[
          ...shifted(first, -1),
          ...month(first),
          ...shifted(first, 1),
          ...shifted(first, 2),
        ]}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        weekHeight={96}
        onMonthsChange={setShown}
      />
      <p className="text-quebi-fg-muted text-sm">
        Months in the window: {shown}. Hover a peeking month to read it, and press
        the chevron on it to go there — the blur eases rather than clearing, and
        the month stays inert until it is the one you are looking at.
      </p>
    </div>
  )
}

/**
 * A month grid ends mid-week, so the last row usually has empty cells in the
 * corner. That is where a legend can sit for free — and `variant="overlay"` is
 * what keeps it a legend on the months where it does not.
 */
const OverlayLegend = () => {
  const first = startOfMonth(today(TIME_ZONE))
  return (
    <div className="relative w-full">
      <MonthView
        events={month(first)}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        weekHeight={120}
      />
      <CalendarLegend calendars={CALENDARS} variant="overlay" className="absolute end-3 bottom-3" />
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
    title: "The legend over the grid",
    description:
      "The corner a month ends in is usually empty, which makes it the cheapest place to put the key — and the least reliable, because next month the weeks reach it. variant=\"overlay\" settles that: the row sits on an elevated, blurred surface, so it reads the same over a spare Saturday and over a full one. Placement stays a class, not a prop.",
    render: () => <OverlayLegend />,
  },
  {
    title: "Two months, side by side",
    description:
      "range={{ months: 2 }} draws this month and the next in one view. The heading names the pair — September – Oktober 2026 — and the chevrons step a whole page, so stepping forward lands on November and December rather than on an overlapping pair. Each grid keeps its own weekday header and dims its own outside days; a chip dragged past the edge of its month clamps there, because the grid beside it is a coordinate space of its own.",
    render: () => <TwoMonths />,
  },
  {
    title: "A carousel of months",
    description:
      "carousel: true draws the side-by-side view through a window. The months either side show a slice of themselves under a veil that ramps outwards — two masked backdrop-blur layers and a dimming gradient, so a peek is sharp where it meets the window and blurred at its outer edge rather than uniformly frosted. Hovering one eases the veil — half the blur, a lighter tint — so it can be read without stopping being a peek; a chevron drawn on it steps there, and the month stays inert either way, because seeing next month is not being in it. With the toolbar present those chevrons are a pointer affordance and stay out of the tab order — the same two presses are already in it — and without one they become everyone's. How many months the window holds is the reader's: range.months seeds the segmented control and onMonthsChange reports what was picked. Every move travels the whole way — a chevron step, Today, or a jump from the month picker slides past every month in between — while the label and your state have the new month from the first frame. Only the ends of a journey are drawn as real months; the ones it only passes are placeholders of the right shape, because nobody can read a grid going by at that speed. A press mid-flight carries on from where the band had got to. Every month in the band is drawn six rows tall, so a February cannot shorten the calendar under the chevron that stepped to it.",
    render: () => <MonthCarousel />,
  },
  {
    title: "A rolling strip of weeks",
    description:
      "range={{ weeks: 8 }} is the same grid with the month taken out of it: a fixed eight rows starting with the week the anchor date falls in. The reader picks a start week rather than a month — the heading opens a week picker — and the chevrons move it one week at a time, so the strip slides rather than paging. Nothing is dimmed, since no day is outside a strip, and the 1st carries its month name as the one marker of where the seam is.",
    render: () => <RollingWeeks />,
  },
  {
    title: "\"+N more\" overflow",
    description:
      "A day with more events than lanes spends its last lane on the overflow link, so the link never covers an event that was drawn underneath it.",
    render: () => <Overflowing />,
  },
  {
    title: "The overflow panel",
    description:
      "The \"+N more\" is a popover trigger by default: it opens onto the whole day — all-day bands first, then the timed events — and a row selects and reports itself exactly as a chip does. A day this full scrolls inside the panel rather than off the screen.",
    render: () => <OverflowPanel />,
  },
  {
    title: "Drag to move",
    description:
      "isEventEditable says which events may be picked up and onEventChange reports which day one was dropped on. A month cell has no time axis, so a move is a whole number of days and the clock is untouched: a 10:00 meeting dropped on Thursday is at 10:00 on Thursday, and a multi-day chip keeps its length. The arrow keys do the same thing from the keyboard — a day left or right, a week up or down — and the ghost is drawn in the lane the drop would really give it. Your state decides whether it lands there.",
    render: () => <DragToMove />,
  },
  {
    title: "Drilling down",
    description:
      "onDayClick, onEventClick and onMoreClick are the three ways out of a month grid — switch to the day view, open a detail panel, or list what a cell hid. Passing onMoreClick is also the opt-out: the link stops opening the built-in panel and the interaction is yours again.",
    render: () => <DrillDown />,
  },
]
