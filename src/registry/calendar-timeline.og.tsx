import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { CalendarTimeline } from "@/components/calendar-timeline"
import { OG_DAY, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue", description: "12 seats · 4F" },
  { id: "borealis", name: "Borealis", color: "orange", description: "8 seats · 4F" },
  { id: "cosmos", name: "Cosmos", color: "brand", description: "20 seats · 3F" },
]

const BOOKINGS: CalendarEvent[] = [
  { id: "b1", title: "Planning", start: at(9), end: at(11), calendarId: "aurora" },
  { id: "b2", title: "Design review", start: at(13), end: at(14, 30), calendarId: "aurora" },
  { id: "b3", title: "1:1", start: at(10), end: at(10, 30), calendarId: "borealis" },
  { id: "b4", title: "Interview", start: at(11), end: at(12), calendarId: "borealis" },
  { id: "b5", title: "Workshop", start: at(9, 30), end: at(12, 30), calendarId: "cosmos" },
  { id: "b6", title: "All hands", start: at(15), end: at(16, 30), calendarId: "cosmos" },
]

/** Rooms down, hours across — the transposed grid the other views do not draw. */
export const calendarTimelineOgScene: OgScene = {
  scale: 1.1,
  render: () => (
    <div className="w-176">
      <CalendarTimeline
        calendars={ROOMS}
        events={BOOKINGS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_DAY}
        startHour={8}
        endHour={17}
      />
    </div>
  ),
}
