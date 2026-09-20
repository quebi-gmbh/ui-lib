import { ConformColorPicker } from "@/components/conform-color-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformColorPickerOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ accent: string }> defaultValue={{ accent: "#14b8a6" }}>
      {(fields) => (
        <ConformColorPicker
          field={fields.accent}
          label="Accent colour"
          description="Swatch and field, one value."
        />
      )}
    </OgForm>
  ),
}
