import { ColorField } from "@/components/color-field"
import { ColorPicker } from "@/components/color-picker"
import { ColorSwatch } from "@/components/color-swatch"
import type { OgScene } from "./types"

/** The control row: one state, a swatch of it and a field on it. */
export const colorPickerOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <ColorPicker defaultValue="#14b8a6">
      <ColorSwatch className="size-9.5 rounded-quebi-sm" />
      <ColorField aria-label="Hex color" className="w-40" />
    </ColorPicker>
  ),
}
