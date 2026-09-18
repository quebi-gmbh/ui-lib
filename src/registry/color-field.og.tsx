import { ColorField } from "@/components/color-field"
import type { OgScene } from "./types"

/** The hex input with the swatch of its own value beside it. */
export const colorFieldOgScene: OgScene = {
  scale: 2,
  render: () => <ColorField aria-label="Color" defaultValue="#14b8a6" className="w-64" />,
}
