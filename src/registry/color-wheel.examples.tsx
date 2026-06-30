import { ColorWheel } from "@/components/color-wheel"
import type { ComponentExample } from "./types"

export const colorWheelExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A hue wheel with an initial value. Drag the thumb around the ring.",
    render: () => <ColorWheel defaultValue="hsl(30, 100%, 50%)" />,
  },
  {
    title: "Disabled",
    description: "A disabled wheel dims the track and makes the thumb non-interactive.",
    render: () => <ColorWheel isDisabled defaultValue="hsl(200, 100%, 50%)" />,
  },
]
