import { Checkbox } from "@/components/checkbox"
import { ConformCheckboxGroup } from "@/components/conform-checkbox-group"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformCheckboxGroupOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ channels: string[] }> defaultValue={{ channels: ["email", "push"] }}>
      {(fields) => (
        <ConformCheckboxGroup
          field={fields.channels}
          label="Notify me by"
          description="At least one, as many as you like."
        >
          <Checkbox value="email">Email</Checkbox>
          <Checkbox value="sms">SMS</Checkbox>
          <Checkbox value="push">Push</Checkbox>
        </ConformCheckboxGroup>
      )}
    </OgForm>
  ),
}
