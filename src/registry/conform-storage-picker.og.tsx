import { ConformStoragePicker } from "@/components/conform-storage-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformStoragePickerOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ storage: string }> defaultValue={{ storage: "128GB" }}>
      {(fields) => (
        <ConformStoragePicker
          field={fields.storage}
          label="Storage configurations"
          description="Every size this device ships in."
        />
      )}
    </OgForm>
  ),
}
