import { ConformCheckbox } from "@/components/conform-checkbox"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

/**
 * Checked from the field's own default, never from a spread `getInputProps` —
 * the shape this component exists to make unnecessary drops both props in
 * silence. See /rules/seed-toggles-with-default-selected.
 */
export const conformCheckboxOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ terms: boolean }> defaultValue={{ terms: true }}>
      {(fields) => (
        <ConformCheckbox field={fields.terms} label="I accept the terms and conditions" />
      )}
    </OgForm>
  ),
}
