import { DayView } from "@/components/day-view"
import { OG_AGENDA, OG_CALENDARS, OG_DAY, OG_TIME_ZONE } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * One morning on a time axis, with the overlap the packing pass exists for.
 *
 * Four hours rather than nine, and no toolbar: a day column is a grid of hour
 * lines, and in a thumbnail every line that holds nothing is a line the reader
 * has to look past to find the two blocks that are the component. What is left
 * is big enough to read the event titles off.
 */
export const dayViewOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <div className="w-144">
      <DayView
        events={OG_AGENDA.slice(0, 3)}
        calendars={OG_CALENDARS}
        timeZone={OG_TIME_ZONE}
        defaultDate={OG_DAY}
        showToolbar={false}
        startHour={9}
        endHour={13}
        height={150}
      />
    </div>
  ),
}
