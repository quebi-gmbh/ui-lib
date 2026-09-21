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
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
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

const DragToMove = () => {
  const start = weekStart()
  const [events, setEvents] = useState<CalendarEvent[]>(() => week(start))
  const [moved, setMoved] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <WeekView
        events={events}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        startHour={8}
        endHour={20}
        height={440}
        // Movable is a question about the event, not about the view: the
        // standups belong to the team and nobody drags those.
        isEventEditable={(event) => !event.id.startsWith("standup")}
        // The view moves nothing. It reports where the event was dropped, and
        // this is the state that decides whether it goes there — refuse the
        // change by not writing it, and the block stays where it was.
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
          : "Drag an event to another time or another day — or tab to one and use the arrow keys."}
      </p>
    </div>
  )
}

/**
 * Where a legend can sit. Four of these are pure layout — the legend is a child
 * and CSS puts it somewhere — and only the last one asks the library for
 * anything, because only the last one has a calendar behind it.
 */
type LegendPlacement = "above" | "beside" | "below" | "overlay"

const LEGEND_PLACEMENTS: readonly { id: LegendPlacement; label: string }[] = [
  { id: "above", label: "Above" },
  { id: "beside", label: "Beside" },
  { id: "below", label: "Below" },
  { id: "overlay", label: "Over the grid" },
]

const LegendPlacements = () => {
  const start = weekStart()
  const [placement, setPlacement] = useState<LegendPlacement>("above")

  const view = (
    <WeekView
      events={week(start)}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
      startHour={8}
      endHour={18}
      height={340}
      className={placement === "beside" ? "min-w-0 flex-1" : undefined}
    />
  )

  return (
    <div className="flex w-full flex-col gap-3">
      <ToggleGroup
        size="sm"
        selectionMode="single"
        aria-label="Legend placement"
        selectedKeys={new Set([placement])}
        // Single selection still lets you press the selected item to clear it;
        // there is no "no placement", so an empty set keeps the current one.
        onSelectionChange={(keys) => {
          const [next] = keys
          if (next) setPlacement(next as LegendPlacement)
        }}
      >
        {LEGEND_PLACEMENTS.map((option) => (
          <ToggleGroupItem key={option.id} id={option.id}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {placement === "above" ? (
        <div className="flex w-full flex-col gap-3">
          <CalendarLegend calendars={CALENDARS} />
          {view}
        </div>
      ) : null}

      {placement === "beside" ? (
        <div className="flex w-full items-start gap-4">
          {view}
          {/* A column rather than a row: direction is layout, so it is a class. */}
          <CalendarLegend calendars={CALENDARS} className="w-28 shrink-0 flex-col items-start" />
        </div>
      ) : null}

      {placement === "below" ? (
        <div className="flex w-full flex-col gap-3">
          {view}
          <CalendarLegend calendars={CALENDARS} className="self-end" />
        </div>
      ) : null}

      {placement === "overlay" ? (
        <div className="relative w-full">
          {view}
          <CalendarLegend
            calendars={CALENDARS}
            variant="overlay"
            className="absolute end-3 bottom-3"
          />
        </div>
      ) : null}
    </div>
  )
}

const OverlayLegend = () => {
  const start = weekStart()
  return (
    <div className="relative w-full">
      <WeekView
        events={week(start)}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        startHour={9}
        endHour={17}
        height={360}
      />
      <CalendarLegend
        calendars={CALENDARS}
        variant="overlay"
        className="absolute start-3 bottom-3"
      />
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
  {
    title: "Where the legend goes",
    description:
      "Placement is layout, so the legend takes no prop for it: it is a child, and a class puts it before the view, after it, or in a column beside it. Over the grid is the one case that needs the library — variant=\"overlay\" draws the same row on an elevated surface, because a bare row of small muted text with events behind it is no longer a legend.",
    render: () => <LegendPlacements />,
  },
  {
    title: "Overlay in the corner the week leaves free",
    description:
      "The same overlay in the other corner, with the hour axis and a column of events behind it. The surface is translucent and blurred, so the key stays readable without hiding what it covers — and which corner it takes is yours, one absolute class.",
    render: () => <OverlayLegend />,
  },
  {
    title: "Drag to move",
    description:
      "isEventEditable says which events may be picked up and onEventChange reports where one was dropped, snapped to the slot grid and never outside the hours the axis draws. The arrow keys do the same thing from the keyboard — a slot up or down, a day left or right — and the ghost shows where the event is about to land. Your state decides whether it actually lands there.",
    render: () => <DragToMove />,
  },
]
