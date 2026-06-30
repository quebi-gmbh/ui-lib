import { ColorArea } from "react-aria-components"
import { ColorThumb } from "@/components/color-thumb"
import type { ComponentExample } from "./types"

export const colorThumbExamples: ComponentExample[] = [
  {
    title: "In a color area",
    description:
      "ColorThumb lives inside a color picker context. Here it sits in a small saturation/brightness area — drag it to move.",
    render: () => (
      <ColorArea
        defaultValue="hsb(220, 100%, 100%)"
        xChannel="saturation"
        yChannel="brightness"
        className="relative size-40 rounded-quebi-md border border-cyan-500/20"
      >
        <ColorThumb />
      </ColorArea>
    ),
  },
  {
    title: "Disabled",
    description: "A disabled color area dims the thumb and makes it non-interactive.",
    render: () => (
      <ColorArea
        isDisabled
        defaultValue="hsb(120, 80%, 90%)"
        xChannel="saturation"
        yChannel="brightness"
        className="relative size-40 rounded-quebi-md border border-cyan-500/20 bg-quebi-bg"
      >
        <ColorThumb />
      </ColorArea>
    ),
  },
]
