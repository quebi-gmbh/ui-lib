import { Radio, RadioGroup } from "@/components/radio"
import type { OgScene } from "./types"

/** Three options, one taken — and the dot is what says "one". */
export const radioOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <RadioGroup defaultValue="express" aria-label="Shipping">
      <Radio value="standard">Standard</Radio>
      <Radio value="express">Express</Radio>
      <Radio value="overnight">Overnight</Radio>
    </RadioGroup>
  ),
}
