import { DateRangePicker, DateRangePickerTrigger } from "@/components/date-range-picker"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * The same argument as Date Picker, with two endpoints and a range calendar —
 * including the one about the label, which is in `date-picker.og.tsx`.
 */
export const dateRangePickerOgScene: OgScene = {
  scale: 1.09,
  align: "top",
  render: () => (
    <DateRangePicker
      aria-label="Stay dates"
      className="w-80"
      defaultValue={{ start: OG_DAY, end: OG_DAY.add({ days: 5 }) }}
      defaultOpen
    >
      <DateRangePickerTrigger />
    </DateRangePicker>
  ),
}
