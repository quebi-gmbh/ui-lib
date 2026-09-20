import { ConformCalendar } from "@/components/conform-calendar"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

/** A pinned day, so the same commit photographs the same month. */
export const conformCalendarOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <OgForm<{ date: string }> defaultValue={{ date: "2024-03-13" }} className="w-fit">
      {(fields) => <ConformCalendar field={fields.date} label="Event date" />}
    </OgForm>
  ),
}
