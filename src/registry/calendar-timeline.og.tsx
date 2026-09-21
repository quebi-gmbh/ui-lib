import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { CalendarTimeline } from "@/components/calendar-timeline"
import { OG_DAY, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

/** Two rooms rather than three, and a morning rather than a working day. */
const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue", description: "12 seats" },
  { id: "cosmos", name: "Cosmos", color: "brand", description: "20 seats" },
]

const BOOKINGS: CalendarEvent[] = [
  { id: "b1", title: "Planning", start: at(9), end: at(10, 30), calendarId: "aurora" },
  { id: "b2", title: "Review", start: at(11, 30), end: at(12, 30), calendarId: "aurora" },
  { id: "b3", title: "Workshop", start: at(9, 30), end: at(12), calendarId: "cosmos" },
]

/** Rooms down, hours across — the transposed grid the other views do not draw. */
export const calendarTimelineOgScene: OgScene = {
  scale: 1.55,
  render: () => (
    <div className="w-160">
      <CalendarTimeline
        calendars={ROOMS}
        events={BOOKINGS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_DAY}
        showToolbar={false}
        startHour={9}
        endHour={13}
      />
    </div>
  ),
}
