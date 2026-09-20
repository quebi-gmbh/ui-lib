import { ConformColorField } from "@/components/conform-color-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformColorFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ accent: string }> defaultValue={{ accent: "#14b8a6" }}>
      {(fields) => (
        <ConformColorField
          field={fields.accent}
          label="Accent colour"
          description="Submitted as hex."
        />
      )}
    </OgForm>
  ),
}
