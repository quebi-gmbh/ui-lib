import { DayView } from "@/components/day-view"
import { OG_AGENDA, OG_CALENDARS, OG_DAY, OG_TIME_ZONE } from "./og-calendar-data"
import type { OgScene } from "./types"

/** One day on a time axis, with the overlap that the packing pass exists for. */
export const dayViewOgScene: OgScene = {
  scale: 1.15,
  render: () => (
    <div className="w-192">
      <DayView
        events={OG_AGENDA}
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
