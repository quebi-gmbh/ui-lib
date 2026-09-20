import { ConformFileTrigger } from "@/components/conform-file-trigger"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformFileTriggerOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ avatar: File }>>
      {(fields) => (
        <ConformFileTrigger
          field={fields.avatar}
          label="Avatar"
          description="PNG or JPEG, 2 MB at most."
          acceptedFileTypes={["image/png", "image/jpeg"]}
          hasDropZone
        />
      )}
    </OgForm>
  ),
}
