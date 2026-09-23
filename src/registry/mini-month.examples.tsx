import {
  type CalendarDate,
  startOfMonth,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  today,
} from "@internationalized/date"
import { useState } from "react"
import { useLocale } from "react-aria-components"
import { Card } from "@/components/card"
import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { FormattedDate } from "@/components/formatted-date"
import { MiniMonth, MiniMonthLegend, type MiniMonthSpan } from "@/components/mini-month"
import { Separator } from "@/components/separator"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Day View. */
const TIME_ZONE = "Europe/Berlin"

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), TIME_ZONE)

const CALENDARS: CalendarSource[] = [
  { id: "visits", name: "Appointments", color: "brand" },
  { id: "calls", name: "Calls", color: "blue" },
  { id: "shifts", name: "Shifts", color: "orange" },
]

const VISITS = ["Check-up", "Home visit", "Consultation", "Follow-up"]
const PEOPLE = ["Hanna Hartmann", "Carola Wessel", "Birte Lorenz", "Mona Berger"]

/**
 * Two months of a practice's week: appointments most weekdays, a call now and
 * then, a shift every fourth or fifth day. Built from the day of the month
 * rather than a random draw, so the same month always looks the same.
 */
function practice(first: CalendarDate): CalendarEvent[] {
  const events: CalendarEvent[] = []
  for (let offset = 0; offset < 62; offset++) {
    const day = first.add({ days: offset })
    const weekday = toCalendarDate(day).toDate(TIME_ZONE).getDay()
    if (weekday === 0 || weekday === 6) continue
    const visits = 1 + (offset % 3)
    for (let index = 0; index < visits; index++) {
      events.push({
        id: `visit-${offset}-${index}`,
        title: `${PEOPLE[(offset + index) % PEOPLE.length]} · ${VISITS[(offset * 3 + index) % VISITS.length]}`,
        start: at(day, 8 + index * 2, 15 * ((offset + index) % 4)),
        end: at(day, 9 + index * 2, 15 * ((offset + index) % 4)),
        calendarId: "visits",
      })
    }
    if (offset % 4 === 1) {
      events.push({
        id: `call-${offset}`,
        title: "Call · Consultation",
        start: at(day, 16),
        end: at(day, 16, 20),
        calendarId: "calls",
      })
    }
    if (offset % 5 === 2) {
      events.push({
        id: `shift-${offset}`,
        title: offset % 2 === 0 ? "Early shift" : "Late shift",
        start: at(day, 7),
        end: at(day, 19),
        calendarId: "shifts",
      })
    }
  }
  return events
}

function absences(first: CalendarDate): MiniMonthSpan[] {
  return [
    { id: "leave", title: "Absence", start: first.add({ days: 12 }), end: first.add({ days: 17 }) },
    { id: "course", title: "Absence", start: first.add({ days: 40 }), end: first.add({ days: 41 }) },
  ]
}

const Default = () => {
  const first = startOfMonth(today(TIME_ZONE))
  return (
    <MiniMonth
      aria-label="Your month"
      events={practice(first)}
      calendars={CALENDARS}
      timeZone={TIME_ZONE}
    />
  )
}

const TwoMonthsWithAbsences = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const spans = absences(first)
  return (
    <div className="flex flex-col items-center gap-4">
      <MiniMonth
        aria-label="Appointments, shifts and absences"
        events={practice(first)}
        calendars={CALENDARS}
        spans={spans}
        months={2}
          timeZone={TIME_ZONE}
      />
      <MiniMonthLegend calendars={CALENDARS} spans={spans} />
    </div>
  )
}

/** The dashboard card: the grid on one side, the picked day's agenda on the other. */
const WithAgenda = () => {
  const first = startOfMonth(today(TIME_ZONE))
  const events = practice(first)
  const spans = absences(first)
  const { locale } = useLocale()
  const [day, setDay] = useState<CalendarDate>(() => today(TIME_ZONE))
  const onDay = events
    .filter((event) => toCalendarDate(event.start).compare(day) === 0)
    .sort((a, b) => a.start.compare(b.start))

  return (
    <Card className="@container w-full">
      <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start @2xl:justify-center @2xl:gap-10">
        <MiniMonth
          aria-label="Your month"
          events={events}
          calendars={CALENDARS}
          spans={spans}
          day={day}
          onDayChange={setDay}
              timeZone={TIME_ZONE}
          className="self-center @2xl:self-start"
        />
        <div className="flex min-w-0 flex-col gap-4 @2xl:max-w-72 @2xl:flex-1">
          <div role="status" aria-label="The picked day" className="flex flex-col gap-2 text-sm">
            <FormattedDate
              date={day.toDate(TIME_ZONE)}
              dateStyle="full"
              locale={locale}
                      timeZone={TIME_ZONE}
              className="font-semibold text-quebi-fg"
            />
            {onDay.length === 0 ? (
              <p className="text-quebi-fg-muted text-xs">Nothing on this day.</p>
            ) : (
              <ul aria-label="Appointments" className="flex flex-col gap-1">
                {onDay.map((event) => (
                  <li key={event.id} className="flex items-center gap-2 py-1">
                    <FormattedDate
                      date={event.start.toDate()}
                      timeStyle="short"
                      locale={locale}
                                      timeZone={TIME_ZONE}
                      className="w-11 shrink-0 font-medium text-quebi-fg-muted text-xs tabular-nums"
                    />
                    <span className="min-w-0 flex-1 truncate text-quebi-fg">{event.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Separator />
          <MiniMonthLegend calendars={CALENDARS} spans={spans} />
        </div>
      </div>
    </Card>
  )
}

const PagedFromOutside = () => {
  const [month, setMonth] = useState(() => startOfMonth(today(TIME_ZONE)))
  return (
    <MiniMonth
      aria-label="Your month"
      events={practice(month)}
      calendars={CALENDARS}
      month={month}
      onMonthChange={setMonth}
      firstDayOfWeek="sun"
      timeZone={TIME_ZONE}
    />
  )
}

export const miniMonthExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "One month, one dot per calendar with something on the day. Arrow keys move between days; Enter picks one.",
    render: () => <Default />,
  },
  {
    title: "Two months, with absences",
    description:
      "months={2} draws this month and the next side by side; spans draws runs of days such as a leave as a band behind the dates. MiniMonthLegend keys both — a dot for a calendar, a bar for a span.",
    render: () => <TwoMonthsWithAbsences />,
  },
  {
    title: "With the picked day's agenda",
    description:
      "The dashboard card. The grid reports the picked day through onDayChange and the page lists what is on it — beside the grid when the card is wide, under it when it is not.",
    render: () => <WithAgenda />,
  },
  {
    title: "Controlled month, Sunday first",
    description:
      "month and onMonthChange hold the page in your state, so a toolbar elsewhere can page it too; firstDayOfWeek moves the start of the week.",
    render: () => <PagedFromOutside />,
  },
]
