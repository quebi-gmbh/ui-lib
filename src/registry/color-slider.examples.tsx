import { useState } from "react"
import { parseColor } from "react-aria-components"
import {
  ColorSlider,
  ColorSliderOutput,
  ColorSliderThumb,
  ColorSliderTrack,
} from "@/components/color-slider"
import type { ComponentExample } from "./types"

export const colorSliderExamples: ComponentExample[] = [
  {
    title: "Hue",
    description: "Adjust a single channel along a live gradient track.",
    render: () => (
      <div className="w-64">
        <ColorSlider label="Hue" defaultValue="hsl(200, 100%, 50%)" channel="hue" />
      </div>
    ),
  },
  {
    title: "Alpha",
    description: "The checkerboard shows transparency through the alpha channel.",
    render: () => (
      <div className="w-64">
        <ColorSlider label="Alpha" defaultValue="hsla(200, 100%, 50%, 0.5)" channel="alpha" />
      </div>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <div className="w-64">
        <ColorSlider label="Hue" defaultValue="hsl(280, 100%, 50%)" channel="hue" isDisabled />
      </div>
    ),
  },
  {
    title: "Vertical",
    description: "Composed from track, thumb, and output sub-components.",
    render: () => (
      <ColorSlider defaultValue="hsl(140, 100%, 50%)" channel="hue" orientation="vertical">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
        <ColorSliderOutput />
      </ColorSlider>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [color, setColor] = useState(parseColor("hsl(200, 100%, 50%)"))
        return (
          <div className="w-64 space-y-2">
            <ColorSlider
              label="Saturation"
              channel="saturation"
              value={color}
              onChange={setColor}
            />
            <p className="text-sm text-quebi-fg-muted">{color.toString("hsl")}</p>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
