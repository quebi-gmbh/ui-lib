import { ConformWeekPicker } from "@/components/conform-week-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformWeekPickerOgScene: OgScene = {
  scale: 1.21,
  render: () => (
    <OgForm<{ week: { start: string; end: string } }>
      defaultValue={{ week: { start: "2024-03-11", end: "2024-03-17" } }}
      className="w-fit"
    >
      {(fields) => <ConformWeekPicker field={fields.week} label="Delivery week" />}
    </OgForm>
  ),
}
