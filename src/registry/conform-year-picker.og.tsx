import { ConformYearPicker } from "@/components/conform-year-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformYearPickerOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <OgForm<{ year: string }> defaultValue={{ year: "2024-01-01" }} className="w-fit">
      {(fields) => <ConformYearPicker field={fields.year} label="Model year" />}
    </OgForm>
  ),
}
