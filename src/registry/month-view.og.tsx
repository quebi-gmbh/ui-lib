import type { CalendarEvent } from "@/components/calendar-shell"
import { MonthView } from "@/components/month-view"
import { OG_CALENDARS, OG_MONTH_START, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

/** A month with three events in it, one of them running across a weekend. */
const MONTH: CalendarEvent[] = [
  {
    id: "kickoff",
    title: "Kickoff",
    start: at(9, 0, OG_MONTH_START.add({ days: 4 })),
    end: at(10, 0, OG_MONTH_START.add({ days: 4 })),
    calendarId: "team",
  },
  {
    id: "offsite",
    title: "Offsite",
    start: at(0, 0, OG_MONTH_START.add({ days: 11 })),
    end: at(0, 0, OG_MONTH_START.add({ days: 14 })),
    allDay: true,
    calendarId: "me",
  },
  {
    id: "release",
    title: "Release",
    start: at(9, 0, OG_MONTH_START.add({ days: 25 })),
    end: at(10, 0, OG_MONTH_START.add({ days: 25 })),
    calendarId: "me",
  },
]

/**
 * A month is six rows of seven days whatever the scene does, so the only room
 * left to make is in the rows themselves: no toolbar, a shorter week, and three
 * events rather than four. `Design review` went with the fourth — it is the one
 * title in the fixture the component had to elide at this width.
 */
export const monthViewOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-192">
      <MonthView
        events={MONTH}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_MONTH_START}
        showToolbar={false}
        weekHeight={36}
      />
    </div>
  ),
}
