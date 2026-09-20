import { Description, Label } from "@/components/field"
import { NumberField, NumberInput } from "@/components/number-field"
import type { OgScene } from "./types"

/** Label, steppers, hint — the whole field, at the size it is used. */
export const numberFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <NumberField defaultValue={4} minValue={0} className="w-72">
      <Label>Quantity</Label>
      <NumberInput />
      <Description>How many seats to add.</Description>
    </NumberField>
  ),
}
