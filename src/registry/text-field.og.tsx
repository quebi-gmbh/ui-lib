import { Description, Label } from "@/components/field"
import { Input } from "@/components/input"
import { TextField } from "@/components/text-field"
import type { OgScene } from "./types"

/** Label, input, description — the field composed the way an app composes it. */
export const textFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <TextField className="w-72" defaultValue="ada@quebi.de">
      <Label>Email</Label>
      <Input type="email" />
      <Description>We'll never share your email.</Description>
    </TextField>
  ),
}
