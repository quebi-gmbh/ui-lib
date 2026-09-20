import { WeekPicker } from "@/components/week-picker"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** A whole week selected at once, with the ISO week numbers in the gutter. */
export const weekPickerOgScene: OgScene = {
  scale: 1.5,
  render: () => <WeekPicker aria-label="Week" defaultValue={{ start: OG_DAY, end: OG_DAY }} />,
}
