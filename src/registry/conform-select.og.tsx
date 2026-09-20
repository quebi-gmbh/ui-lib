import { ConformSelect } from "@/components/conform-select"
import { SelectItem } from "@/components/select"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformSelectOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ plan: string }> defaultValue={{ plan: "pro" }}>
      {(fields) => (
        <ConformSelect field={fields.plan} label="Plan" description="Billed monthly.">
          <SelectItem id="free">Free</SelectItem>
          <SelectItem id="pro">Pro</SelectItem>
          <SelectItem id="enterprise">Enterprise</SelectItem>
        </ConformSelect>
      )}
    </OgForm>
  ),
}
