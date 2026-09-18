import { DatePicker, DatePickerTrigger } from "@/components/date-picker"
import { Description, Label } from "@/components/field"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * Open, with the calendar under the trigger: closed, this is a DateField with a
 * button on the end, and the overlay is the difference.
 */
export const datePickerOgScene: OgScene = {
  scale: 1.1,
  align: "top",
  render: () => (
    <DatePicker className="w-64" defaultValue={OG_DAY} defaultOpen>
      <Label>Event date</Label>
      <DatePickerTrigger />
      <Description>Pick the day the event takes place.</Description>
    </DatePicker>
  ),
}
