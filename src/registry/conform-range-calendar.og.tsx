import { ConformRangeCalendar } from "@/components/conform-range-calendar"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformRangeCalendarOgScene: OgScene = {
  scale: 1.22,
  render: () => (
    <OgForm<{ stay: { start: string; end: string } }>
      defaultValue={{ stay: { start: "2024-03-13", end: "2024-03-18" } }}
      className="w-fit"
    >
      {(fields) => <ConformRangeCalendar field={fields.stay} label="Stay dates" />}
    </OgForm>
  ),
}
