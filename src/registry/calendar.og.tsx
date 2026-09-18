import { Calendar } from "@/components/calendar"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** A pinned month with a pinned day chosen in it. */
export const calendarOgScene: OgScene = {
  scale: 1.5,
  render: () => <Calendar aria-label="Event date" defaultValue={OG_DAY} />,
}
