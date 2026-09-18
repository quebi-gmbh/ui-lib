import { Label } from "@/components/field"
import { TextField } from "@/components/text-field"
import { Textarea } from "@/components/textarea"
import type { OgScene } from "./types"

/** Multi-line, with enough text in it to show the box is taller than an Input. */
export const textareaOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <TextField
      className="w-80"
      defaultValue="The date picker now opens on the month you are looking at, not on today."
    >
      <Label>Release note</Label>
      <Textarea rows={3} />
    </TextField>
  ),
}
