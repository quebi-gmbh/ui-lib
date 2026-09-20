import { Label } from "@/components/field"
import { Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack } from "@/components/slider"
import type { OgScene } from "./types"

/** One value, off both ends of the track, with the output reading it back. */
export const sliderOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <Slider defaultValue={62} className="w-72">
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
}
