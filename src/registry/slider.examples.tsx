import { useState } from "react"
import { Label } from "@/components/field"
import {
  Slider,
  SliderFill,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "@/components/slider"
import type { ComponentExample } from "./types"

export const sliderExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A single-value slider with a label and live value output.",
    render: () => (
      <Slider defaultValue={40} className="w-72">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-quebi-fg">Volume</Label>
          <SliderOutput />
        </div>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
  },
  {
    title: "Range",
    description: "Two thumbs select a range; the fill spans between them.",
    render: () => (
      <Slider defaultValue={[25, 75]} className="w-72">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-quebi-fg">Price</Label>
          <SliderOutput>
            {({ state }) =>
              state.values.map((_, i) => state.getThumbValueLabel(i)).join(" – ")
            }
          </SliderOutput>
        </div>
        <SliderTrack>
          <SliderFill />
          <SliderThumb index={0} />
          <SliderThumb index={1} />
        </SliderTrack>
      </Slider>
    ),
  },
  {
    title: "Disabled",
    description: "Non-interactive, dimmed state.",
    render: () => (
      <Slider defaultValue={60} isDisabled className="w-72">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-quebi-fg">Brightness</Label>
          <SliderOutput />
        </div>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
  },
  {
    title: "Vertical",
    description: "Vertical orientation.",
    render: () => (
      <Slider defaultValue={50} orientation="vertical" className="h-48">
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState(30)
        return (
          <Slider value={value} onChange={(v) => setValue(v as number)} className="w-72">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-quebi-fg">Opacity</Label>
              <SliderOutput />
            </div>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
          </Slider>
        )
      }
      return <ControlledExample />
    },
  },
]
