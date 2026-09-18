import { ConformNumberField } from "@/components/conform-number-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformNumberFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ seats: number }> defaultValue={{ seats: 4 }}>
      {(fields) => (
        <ConformNumberField
          field={fields.seats}
          label="Seats"
          description="How many to add."
        />
      )}
    </OgForm>
  ),
}
