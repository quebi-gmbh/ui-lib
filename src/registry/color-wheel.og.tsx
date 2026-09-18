import { ColorWheel } from "@/components/color-wheel"
import type { OgScene } from "./types"

/** The hue ring, with the thumb parked at a fixed angle. */
export const colorWheelOgScene: OgScene = {
  scale: 1.6,
  render: () => <ColorWheel defaultValue="hsl(174, 100%, 40%)" />,
}
