import { ConformSwitch } from "@/components/conform-switch"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformSwitchOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ autosave: boolean }> defaultValue={{ autosave: true }}>
      {(fields) => (
        <ConformSwitch
          field={fields.autosave}
          label="Autosave drafts"
          description="Saved as you type."
        />
      )}
    </OgForm>
  ),
}
