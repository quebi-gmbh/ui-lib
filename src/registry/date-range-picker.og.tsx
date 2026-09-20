import { DateRangePicker, DateRangePickerTrigger } from "@/components/date-range-picker"
import { Description, Label } from "@/components/field"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** The same argument as Date Picker, with two endpoints and a range calendar. */
export const dateRangePickerOgScene: OgScene = {
  scale: 1.1,
  align: "top",
  render: () => (
    <DateRangePicker
      className="w-80"
      defaultValue={{ start: OG_DAY, end: OG_DAY.add({ days: 5 }) }}
      defaultOpen
    >
      <Label>Stay dates</Label>
      <DateRangePickerTrigger />
      <Description>Pick your check-in and check-out days.</Description>
    </DateRangePicker>
  ),
}
