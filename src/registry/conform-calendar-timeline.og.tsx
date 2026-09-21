import type { CalendarEvent, CalendarSource } from "@/components/calendar-shell"
import { ConformCalendarTimeline } from "@/components/conform-calendar-timeline"
import { at, OG_DAY, OG_TIME_ZONE } from "./og-calendar-data"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue", description: "12 seats · 4F" },
  { id: "borealis", name: "Borealis", color: "orange", description: "8 seats · 4F" },
]

const BOOKINGS: CalendarEvent[] = [
  { id: "b1", title: "Planning", start: at(9), end: at(11), calendarId: "aurora" },
  { id: "b2", title: "Design review", start: at(13), end: at(15), calendarId: "aurora" },
  { id: "b3", title: "Interview", start: at(10), end: at(12), calendarId: "borealis" },
]

/** A room plan that is a form value: the label above it is the giveaway. */
export const conformCalendarTimelineOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <OgForm<{ bookings: string }> className="w-176">
      {(fields) => (
        <ConformCalendarTimeline
          field={fields.bookings}
          label="Room bookings"
          defaultEvents={BOOKINGS}
          calendars={ROOMS}
          timeZone={OG_TIME_ZONE}
          defaultDate={OG_DAY}
          startHour={8}
          endHour={17}
          showToolbar={false}
        />
      )}
    </OgForm>
  ),
}
