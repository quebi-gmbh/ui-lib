import { ColorSwatch } from "@/components/color-swatch"
import { ColorSwatchPicker, ColorSwatchPickerItem } from "@/components/color-swatch-picker"
import type { OgScene } from "./types"

const PALETTE = ["#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#f59e0b"]

/** Six swatches with one taken, wearing the neutral halo that reads over any hue. */
export const colorSwatchPickerOgScene: OgScene = {
  scale: 2,
  render: () => (
    <ColorSwatchPicker defaultValue="#14b8a6" aria-label="Accent color">
      {PALETTE.map((color) => (
        <ColorSwatchPickerItem key={color} color={color}>
          <ColorSwatch className="size-8" />
        </ColorSwatchPickerItem>
      ))}
    </ColorSwatchPicker>
  ),
}
