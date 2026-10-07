import { getDayOfWeek } from "@internationalized/date"
import type { CalendarEvent } from "@/components/calendar-shell"
import { YearView } from "@/components/year-view"
import { OG_CALENDARS, OG_MONTH_START, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * Weekdays from March to May, none to four events each, following a fixed
 * cycle so the heatmap has every step in it and the same steps every build.
 * The weekday is asked of the date itself (`en-GB` weeks start on Monday), not
 * of a `Date`, whose `getDay()` answers in the build machine's zone.
 */
const EVENTS: CalendarEvent[] = Array.from({ length: 92 }, (_, offset) =>
  OG_MONTH_START.add({ days: offset }),
).flatMap((day, offset) => {
  if (getDayOfWeek(day, "en-GB") >= 5) return []
  const count = (offset * 7) % 5
  return Array.from({ length: count }, (_, index) => ({
    id: `${day}-${index}`,
    title: "Visit",
    start: at(8 + index, 0, day),
    end: at(9 + index, 0, day),
    calendarId: OG_CALENDARS[index % OG_CALENDARS.length]?.id,
  }))
})

/**
 * A quarter, not the year: twelve cards at thumbnail size are twelve grey
 * squares, and three are enough to show what the thing is — month cards whose
 * days step through the ink scale, with the legend saying what the steps mean.
 */
export const yearViewOgScene: OgScene = {
  // The largest scale at which the three cards and the legend clear the stage.
  scale: 1.33,
  render: () => (
    <YearView
      className="w-3xl"
      events={EVENTS}
      months={[3, 4, 5]}
      defaultDate={OG_MONTH_START}
      timeZone={OG_TIME_ZONE}
      locale="en-GB"
      now={null}
      showToolbar={false}
    />
  ),
}
