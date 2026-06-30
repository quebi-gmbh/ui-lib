import { parseColor } from "react-aria-components"
import { ColorArea } from "@/components/color-area"
import type { ComponentExample } from "./types"

export const colorAreaExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A saturation/brightness gradient with a draggable thumb.",
    render: () => (
      <ColorArea
        defaultValue={parseColor("hsb(219, 58%, 93%)")}
        xChannel="saturation"
        yChannel="brightness"
        aria-label="Saturation and brightness"
      />
    ),
  },
  {
    title: "Disabled",
    description: "Non-interactive state.",
    render: () => (
      <ColorArea
        defaultValue={parseColor("hsb(219, 58%, 93%)")}
        xChannel="saturation"
        yChannel="brightness"
        isDisabled
        aria-label="Saturation and brightness"
      />
    ),
  },
]
