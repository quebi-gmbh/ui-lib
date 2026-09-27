import {
  CalendarDate,
  getDayOfWeek,
  Time,
  toCalendarDateTime,
  toZoned,
  today,
} from "@internationalized/date"
import { useState } from "react"
import { useLocale } from "react-aria-components"
import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { FormattedDate } from "@/components/formatted-date"
import { Text } from "@/components/text"
import { YearView } from "@/components/year-view"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Day View. */
const TIME_ZONE = "Europe/Berlin"

const CALENDARS: CalendarSource[] = [
  { id: "visits", name: "Appointments", color: "brand" },
  { id: "calls", name: "Calls", color: "blue" },
  { id: "shifts", name: "Shifts", color: "orange" },
]

const TITLES = ["Check-up", "Visit", "Call", "Review", "Lab", "Shift"]

const at = (day: CalendarDate, hour: number) =>
  toZoned(toCalendarDateTime(day, new Time(hour)), TIME_ZONE)

/**
 * A practice's year: nothing at weekends, a quiet August, and a count per day
 * built from the day's position in the year rather than drawn at random, so the
 * same year always looks the same.
 */
function practiceYear(year: number): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const first = new CalendarDate(year, 1, 1)
  for (let offset = 0; offset < 365; offset++) {
    const day = first.add({ days: offset })
    // Asked of the date, not of a `Date`, whose weekday is the runtime zone's.
    if (getDayOfWeek(day, "en-GB") >= 5 || day.month === 8) continue
    const count = (offset * 7 + day.month * 3) % 6
    for (let index = 0; index < count; index++) {
      events.push({
        id: `${day}-${index}`,
        title: TITLES[(offset + index) % TITLES.length] ?? "Visit",
        start: at(day, 8 + index * 2),
        end: at(day, 9 + index * 2),
        calendarId: CALENDARS[(offset + index) % CALENDARS.length]?.id,
      })
    }
  }
  return events
}

/** Commits per day, as a server would return them: a record, not a list. */
function commitCounts(year: number): Record<string, number> {
  const counts: Record<string, number> = {}
  const first = new CalendarDate(year, 1, 1)
  for (let offset = 0; offset < 365; offset++) {
    const day = first.add({ days: offset })
    const value = (offset * 13 + day.day * 5) % 17
    if (value > 6) counts[day.toString()] = value - 6
  }
  return counts
}

/**
 * Where a day or a month would take the reader. An app passes
 * `dayHref={(day) => `/calendar/day/${day}`}` instead; the gallery has no such
 * route, so it says what was pressed.
 */
function useLastPressed() {
  const { locale } = useLocale()
  const [pressed, setPressed] = useState<CalendarDate | null>(null)
  const status = (
    <Text role="status" className="text-sm">
      {pressed ? (
        <>
          Would open{" "}
          <FormattedDate
            date={pressed.toDate(TIME_ZONE)}
            dateStyle="long"
            locale={locale}
            timeZone={TIME_ZONE}
          />
        </>
      ) : (
        "Press a day or a month."
      )}
    </Text>
  )
  return { status, onPress: setPressed }
}

const Heatmap = () => {
  const year = today(TIME_ZONE).year
  const { status, onPress } = useLastPressed()
  return (
    <div className="flex w-full flex-col gap-4">
      <YearView
        events={practiceYear(year)}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        onDayAction={onPress}
        onMonthAction={onPress}
      />
      {status}
    </div>
  )
}

const Count = () => {
  const year = today(TIME_ZONE).year
  return <YearView variant="count" events={practiceYear(year)} timeZone={TIME_ZONE} />
}

const List = () => {
  const year = today(TIME_ZONE).year
  const { status, onPress } = useLastPressed()
  return (
    <div className="flex w-full flex-col gap-4">
      <YearView
        variant="list"
        events={practiceYear(year)}
        calendars={CALENDARS}
        timeZone={TIME_ZONE}
        maxItems={2}
        onDayAction={onPress}
        onMonthAction={onPress}
      />
      {status}
    </div>
  )
}

const Empty = () => <YearView events={[]} timeZone={TIME_ZONE} />

const Aggregate = () => {
  const year = today(TIME_ZONE).year
  return (
    <YearView
      counts={commitCounts(year)}
      timeZone={TIME_ZONE}
      dayLabel={(count, day, format) => `${format(count)} ${count === 1 ? "commit" : "commits"} on ${day}`}
      legendLabels={{ max: (max) => `(up to ${max} commits in a day)` }}
    />
  )
}

const SundayFirst = () => {
  const year = today(TIME_ZONE).year
  return <YearView variant="count" locale="en-US" events={practiceYear(year)} timeZone={TIME_ZONE} />
}

export const yearViewExamples: ComponentExample[] = [
  {
    title: "Heatmap",
    description:
      "The default. A day's fill steps with how many events touch it, against the year's busiest day — but never fewer than one event to a step, so a quiet year is not painted full. Days with something on them and the month headings are links; give them somewhere to go with dayHref / monthHref or onDayAction / onMonthAction.",
    render: () => <Heatmap />,
  },
  {
    title: "Count",
    description:
      "The exact number instead of a shade, for when 3 or 4 matters more than the shape of the year. A caption says what the number counts.",
    render: () => <Count />,
  },
  {
    title: "List with +N more",
    description:
      "Larger cells naming each day's first events in their calendar's colour; the rest fold into the same \"+N more\" panel Month View opens. Fewer cards to a row, because a title needs width.",
    render: () => <List />,
  },
  {
    title: "Empty year",
    description:
      "Nothing on any day: every cell is inert, and the legend drops its \"up to\" because there is no scale to state.",
    render: () => <Empty />,
  },
  {
    title: "Aggregate counts",
    description:
      "counts takes a { \"YYYY-MM-DD\": n } record — what a server returns when the year is an aggregate, such as commits, rather than a list of events. The label and the legend say what is being counted.",
    render: () => <Aggregate />,
  },
  {
    title: "Sunday-first locale",
    description:
      "locale=\"en-US\": the weekday initials, the column the 1st lands in and every date the cells are named with follow it. firstDayOfWeek overrides the first column alone.",
    render: () => <SundayFirst />,
  },
]
