import { ConformDateField } from "@/components/conform-date-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformDateFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ date: string }> defaultValue={{ date: "2024-03-13" }}>
      {(fields) => (
        <ConformDateField
          field={fields.date}
          label="Event date"
          description="The day it takes place."
        />
      )}
    </OgForm>
  ),
}
