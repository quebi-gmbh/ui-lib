import { ConformTagField } from "@/components/conform-tag-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformTagFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ tags: string[] }> defaultValue={{ tags: ["kiosk", "checkout", "beta"] }}>
      {(fields) => <ConformTagField field={fields.tags} label="Tags" />}
    </OgForm>
  ),
}
