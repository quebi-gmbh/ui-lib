import { ColorSwatch } from "@/components/color-swatch"
import type { OgScene } from "./types"

/** Four swatches, including a transparent one — the checkerboard is the tell. */
export const colorSwatchOgScene: OgScene = {
  scale: 2.4,
  render: () => (
    <div className="flex items-center gap-4">
      <ColorSwatch color="#14b8a6" aria-label="Teal" />
      <ColorSwatch color="#0ea5e9" aria-label="Sky" />
      <ColorSwatch color="#a855f7" aria-label="Purple" />
      <ColorSwatch color="#f59e0b80" aria-label="Amber, half transparent" />
    </div>
  ),
}
