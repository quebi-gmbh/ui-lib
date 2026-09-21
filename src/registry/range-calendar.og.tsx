import { RangeCalendar } from "@/components/range-calendar"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** A five-day range, because the fill between the endpoints is the component. */
export const rangeCalendarOgScene: OgScene = {
  scale: 1.35,
  render: () => (
    <RangeCalendar
      aria-label="Trip dates"
      defaultValue={{ start: OG_DAY, end: OG_DAY.add({ days: 5 }) }}
    />
  ),
}
