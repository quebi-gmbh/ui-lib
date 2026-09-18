import { ConformRadioGroup } from "@/components/conform-radio-group"
import { Radio } from "@/components/radio"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformRadioGroupOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ plan: string }> defaultValue={{ plan: "pro" }}>
      {(fields) => (
        <ConformRadioGroup
          field={fields.plan}
          label="Plan"
          description="You can change this at any time."
        >
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="team">Team</Radio>
        </ConformRadioGroup>
      )}
    </OgForm>
  ),
}
