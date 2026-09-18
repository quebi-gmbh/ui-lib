import type { CalendarEvent } from "@/components/calendar-shell"
import { MonthView } from "@/components/month-view"
import { OG_CALENDARS, OG_MONTH_START, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

/** A month with a handful of events spread across it, including a multi-day one. */
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
    id: "review",
    title: "Design review",
    start: at(14, 0, OG_MONTH_START.add({ days: 19 })),
    end: at(15, 0, OG_MONTH_START.add({ days: 19 })),
    calendarId: "team",
  },
  {
    id: "release",
    title: "Release",
    start: at(16, 0, OG_MONTH_START.add({ days: 25 })),
    end: at(17, 0, OG_MONTH_START.add({ days: 25 })),
    calendarId: "me",
  },
]

export const monthViewOgScene: OgScene = {
  scale: 0.95,
  render: () => (
    <div className="w-192">
      <MonthView
        events={MONTH}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_MONTH_START}
        weekHeight={62}
      />
    </div>
  ),
}
