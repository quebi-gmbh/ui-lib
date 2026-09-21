import { Description, Field, FieldError, Label } from "@/components/field"
import { Input } from "@/components/input"
import { TextField } from "@/components/text-field"
import type { OgScene } from "./types"

/**
 * The stack Field exists to arrange, in the state that proves it arranges it:
 * label, control, and the error that replaces the description.
 */
export const fieldOgScene: OgScene = {
  scale: 1.75,
  render: () => (
    <div className="flex w-72 flex-col gap-5">
      <TextField defaultValue="Acme Inc.">
        <Field>
          <Label>Workspace name</Label>
          <Input />
          <Description>This is how your team will see it.</Description>
        </Field>
      </TextField>
      <TextField isInvalid defaultValue="Acme Inc.">
        <Field>
          <Label>Subdomain</Label>
          <Input />
          <FieldError>Lowercase letters and dashes only.</FieldError>
        </Field>
      </TextField>
    </div>
  ),
}
