import { DateField, DateInput } from "@/components/date-field"
import { Description, Label } from "@/components/field"
import { OG_DAY } from "./og-calendar-data"
import type { OgScene } from "./types"

/** Segments with a value in them — an empty date field is three dashes. */
export const dateFieldOgScene: OgScene = {
  scale: 2,
  render: () => (
    <DateField className="w-64" defaultValue={OG_DAY}>
      <Label>Event date</Label>
      <DateInput />
      <Description>The day the event takes place.</Description>
    </DateField>
  ),
}
