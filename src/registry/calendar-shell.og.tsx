import { CalendarShell } from "@/components/calendar-shell"
import { OG_AGENDA, OG_CALENDARS, OG_DAY, OG_TIME_ZONE } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * The grid with no toolbar over it — which is the component: hand it the days
 * and it draws them, and Day View and Week View are this plus a date.
 */
export const calendarShellOgScene: OgScene = {
  scale: 1.15,
  render: () => (
    <div className="w-176">
      <CalendarShell
        days={[OG_DAY]}
        events={OG_AGENDA}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        startHour={8}
        endHour={17}
        height={210}
      />
    </div>
  ),
}
