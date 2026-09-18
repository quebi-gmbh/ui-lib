import { MonthPicker } from "@/components/month-picker"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** Twelve locale-formatted months and a year stepper, with March taken. */
export const monthPickerOgScene: OgScene = {
  scale: 1.8,
  render: () => <MonthPicker aria-label="Month" defaultValue={OG_DAY} />,
}
