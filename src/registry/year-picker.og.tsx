import { YearPicker } from "@/components/year-picker"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** One decade per page, the year either side dimmed in place. */
export const yearPickerOgScene: OgScene = {
  scale: 1.8,
  render: () => <YearPicker aria-label="Year" defaultValue={OG_DAY} />,
}
