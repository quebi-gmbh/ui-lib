import { ComboBoxContent, ComboBoxItem } from "@/components/combo-box"
import { ConformComboBox } from "@/components/conform-combo-box"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

const COUNTRIES = [
  { id: "de", name: "Germany" },
  { id: "fr", name: "France" },
  { id: "es", name: "Spain" },
]

export const conformComboBoxOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ country: string }> defaultValue={{ country: "de" }}>
      {(fields) => (
        <ConformComboBox
          field={fields.country}
          label="Country"
          description="The option's key is what submits."
        >
          <ComboBoxContent items={COUNTRIES}>
            {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
          </ComboBoxContent>
        </ConformComboBox>
      )}
    </OgForm>
  ),
}
