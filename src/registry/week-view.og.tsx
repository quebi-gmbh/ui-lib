import type { CalendarEvent } from "@/components/calendar-shell"
import { WeekView } from "@/components/week-view"
import { OG_CALENDARS, OG_DAY, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * Five columns with something on four of them, over one morning.
 *
 * Every title here is one word on purpose, and no two of them share a day. A
 * column gets a fifth of the stage — "Design review" in that space is the
 * component eliding it to "Desi…", and two events at the same hour halve the
 * column again and elide the one-word titles too. The overlap belongs to Day
 * View, which has the width to show it.
 *
 * Five columns rather than seven for the same reason, and `visibleDays` is the
 * prop that says so: at seven, a column is 100px wide and the component elides
 * the times under the titles — `11:00 – 12:…` — which is the picture saying it
 * does not fit. A working week is also a week.
 */
const WEEK: CalendarEvent[] = [
  { id: "focus", title: "Focus", start: at(9, 30), end: at(12), calendarId: "me" },
  {
    id: "review",
    title: "Review",
    start: at(10, 0, OG_DAY.add({ days: 2 })),
    end: at(11, 30, OG_DAY.add({ days: 2 })),
    calendarId: "team",
  },
  {
    id: "onsite",
    title: "Onsite",
    start: at(10, 0, OG_DAY.add({ days: 1 })),
    end: at(12, 30, OG_DAY.add({ days: 1 })),
    calendarId: "me",
  },
  {
    id: "demo",
    title: "Demo",
    start: at(11, 0, OG_DAY.subtract({ days: 2 })),
    end: at(12, 0, OG_DAY.subtract({ days: 2 })),
    calendarId: "team",
  },
]

export const weekViewOgScene: OgScene = {
  scale: 1.55,
  render: () => (
    <div className="w-176">
      <WeekView
        events={WEEK}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_DAY}
        showToolbar={false}
        visibleDays={5}
        firstDayOfWeek="mon"
        startHour={9}
        endHour={13}
        height={150}
      />
    </div>
  ),
}
