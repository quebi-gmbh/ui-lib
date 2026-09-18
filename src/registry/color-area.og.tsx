import { ColorArea } from "@/components/color-area"
import type { OgScene } from "./types"

/**
 * The hex values in the colour scenes are values, not design decisions: a
 * component whose subject is colour has to be photographed holding one.
 */
export const colorAreaOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <ColorArea
      defaultValue="hsb(219, 58%, 93%)"
      xChannel="saturation"
      yChannel="brightness"
      aria-label="Saturation and brightness"
    />
  ),
}
