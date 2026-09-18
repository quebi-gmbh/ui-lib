import { WeekView } from "@/components/week-view"
import { OG_AGENDA, OG_CALENDARS, OG_DAY, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { CalendarEvent } from "@/components/calendar-shell"
import type { OgScene } from "./types"

/** Seven columns, with something on more than one of them. */
const WEEK: CalendarEvent[] = [
  ...OG_AGENDA.slice(0, 3),
  {
    id: "onsite",
    title: "Onsite",
    start: at(10, 0, OG_DAY.add({ days: 1 })),
    end: at(15, 0, OG_DAY.add({ days: 1 })),
    calendarId: "me",
  },
  {
    id: "demo",
    title: "Customer demo",
    start: at(11, 0, OG_DAY.subtract({ days: 2 })),
    end: at(12, 0, OG_DAY.subtract({ days: 2 })),
    calendarId: "team",
  },
]

export const weekViewOgScene: OgScene = {
  scale: 1.15,
  render: () => (
    <div className="w-192">
      <WeekView
        events={WEEK}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_DAY}
        startHour={8}
        endHour={17}
        height={210}
      />
    </div>
  ),
}
