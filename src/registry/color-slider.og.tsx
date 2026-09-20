import { ColorSlider } from "@/components/color-slider"
import type { OgScene } from "./types"

/** Two channels of the same colour, each on its own live gradient. */
export const colorSliderOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <ColorSlider label="Hue" defaultValue="hsl(174, 100%, 40%)" channel="hue" />
      <ColorSlider label="Lightness" defaultValue="hsl(174, 100%, 40%)" channel="lightness" />
    </div>
  ),
}
