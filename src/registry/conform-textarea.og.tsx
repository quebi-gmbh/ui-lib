import { ConformTextarea } from "@/components/conform-textarea"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformTextareaOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ note: string }>
      defaultValue={{ note: "The date picker now opens on the month you are looking at." }}
    >
      {(fields) => <ConformTextarea field={fields.note} label="Release note" rows={3} />}
    </OgForm>
  ),
}
