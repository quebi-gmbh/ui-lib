import { CalendarToolbar } from "@/components/calendar-toolbar"
import type { OgScene } from "./types"

/** The bar the calendar views share: a label, the chevrons, the view switch. */
export const calendarToolbarOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-176">
      <CalendarToolbar label="März 2024" view="week" />
    </div>
  ),
}
