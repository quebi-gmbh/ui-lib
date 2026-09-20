import { CalendarDate, Time, toCalendarDateTime, toZoned } from "@internationalized/date"
import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"

/**
 * The fixtures the calendar OG scenes share.
 *
 * Every date here is a literal, and that is the whole point. The gallery
 * examples build their days from `today()`, which is right for a page someone
 * is reading and wrong for a build artifact: a share image photographed from
 * the clock is a different file every day, and "the same commit produces the
 * same PNG" is the property the screenshot step is supposed to have. A pinned
 * day in the past also means the now-marker and the today ring never appear,
 * which is one fewer moving part in the picture.
 */

/** Pinned rather than read from the runtime, for the same reason. */
export const OG_TIME_ZONE = "Europe/Berlin"

/** A Wednesday, safely in the past, and never today again. */
export const OG_DAY = new CalendarDate(2024, 3, 13)

/** The first of the month `OG_DAY` falls in. */
export const OG_MONTH_START = new CalendarDate(2024, 3, 1)

/** `at(9, 30)` — half past nine on `OG_DAY`, in the zone above. */
export const at = (hour: number, minute = 0, day = OG_DAY) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), OG_TIME_ZONE)

export const OG_CALENDARS: CalendarSource[] = [
  { id: "me", name: "My calendar", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
]

export const OG_AGENDA: CalendarEvent[] = [
  { id: "standup", title: "Standup", start: at(9), end: at(9, 15), calendarId: "team" },
  {
    id: "focus",
    title: "Focus block",
    start: at(9, 30),
    end: at(12),
    calendarId: "me",
    location: "Desk",
  },
  { id: "design", title: "Design review", start: at(10), end: at(11), calendarId: "team" },
  { id: "lunch", title: "Lunch", start: at(12, 30), end: at(13, 30), calendarId: "me" },
  { id: "retro", title: "Retro", start: at(15), end: at(16), calendarId: "team" },
]
