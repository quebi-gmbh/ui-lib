import { ConformTimeField } from "@/components/conform-time-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformTimeFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ start: string }> defaultValue={{ start: "09:30" }}>
      {(fields) => (
        <ConformTimeField field={fields.start} label="Start time" description="Local time." />
      )}
    </OgForm>
  ),
}
