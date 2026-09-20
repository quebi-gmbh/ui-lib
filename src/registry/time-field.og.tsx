import { Time } from "@internationalized/date"
import { Label } from "@/components/field"
import { TimeField, TimeInput } from "@/components/time-field"
import type { OgScene } from "./types"

/** A pinned time — the clock has no business in a build artifact. */
export const timeFieldOgScene: OgScene = {
  scale: 2,
  render: () => (
    <TimeField className="w-64" defaultValue={new Time(9, 30)}>
      <Label>Event time</Label>
      <TimeInput />
    </TimeField>
  ),
}
