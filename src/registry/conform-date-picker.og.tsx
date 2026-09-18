import { ConformDatePicker } from "@/components/conform-date-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformDatePickerOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ date: string }> defaultValue={{ date: "2024-03-13" }}>
      {(fields) => (
        <ConformDatePicker
          field={fields.date}
          label="Event date"
          description="Pick it, or type it."
        />
      )}
    </OgForm>
  ),
}
