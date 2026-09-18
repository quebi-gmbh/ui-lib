import { ConformSlider } from "@/components/conform-slider"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformSliderOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ volume: number }> defaultValue={{ volume: 62 }}>
      {(fields) => <ConformSlider field={fields.volume} label="Volume" maxValue={100} />}
    </OgForm>
  ),
}
