import { CalendarShell } from "@/components/calendar-shell"
import { OG_AGENDA, OG_CALENDARS, OG_DAY, OG_TIME_ZONE } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * The grid with no toolbar over it — which is the component: hand it the days
 * and it draws them, and Day View and Week View are this plus a date.
 *
 * Two days and one morning of them. The shell will draw a whole working day
 * across a week if it is asked to, and at thumbnail size that is a field of
 * empty hour lines with the events lost in it.
 */
export const calendarShellOgScene: OgScene = {
  scale: 1.55,
  render: () => (
    <div className="w-160">
      <CalendarShell
        days={[OG_DAY, OG_DAY.add({ days: 1 })]}
        events={OG_AGENDA.slice(0, 3)}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        startHour={9}
        endHour={13}
        height={150}
      />
    </div>
  ),
}
