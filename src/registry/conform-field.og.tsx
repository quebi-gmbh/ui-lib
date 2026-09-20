import { ConformField } from "@/components/conform-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

/**
 * The bound text field: label, control and description all come off the field
 * metadata rather than from markup beside it, which is the whole binding.
 */
export const conformFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ email: string }> defaultValue={{ email: "ada@quebi.de" }}>
      {(fields) => (
        <ConformField
          field={fields.email}
          label="Work email"
          description="We'll never share it."
        />
      )}
    </OgForm>
  ),
}
