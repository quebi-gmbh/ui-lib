import { ConformColorSwatchPicker } from "@/components/conform-color-swatch-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

/** The default selection is the field's, not the list's — so it is seeded here. */
export const conformColorSwatchPickerOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ colors: string[] }> defaultValue={{ colors: ["teal", "violet"] }}>
      {(fields) => (
        <ConformColorSwatchPicker
          field={fields.colors}
          label="Device colours"
          description="Submitted as a list of keys."
        />
      )}
    </OgForm>
  ),
}
