import { DatePicker, DatePickerTrigger } from "@/components/date-picker"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/**
 * Open, with the calendar under the trigger: closed, this is a DateField with a
 * button on the end, and the overlay is the difference.
 *
 * No label and no description, which is the only spare height there is. A
 * trigger with a month hanging under it is 360px of component before either of
 * them, in a stage 380px tall — so the scale is decided entirely by the overlay,
 * and every line above it comes out of the calendar's own size. The picture that
 * is left is a date in a field and the month it was chosen in, which is what a
 * date picker is; `aria-label` keeps the accessible name a field needs.
 */
export const datePickerOgScene: OgScene = {
  scale: 1.13,
  align: "top",
  render: () => (
    <DatePicker aria-label="Event date" className="w-64" defaultValue={OG_DAY} defaultOpen>
      <DatePickerTrigger />
    </DatePicker>
  ),
}
