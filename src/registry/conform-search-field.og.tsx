import { ConformSearchField } from "@/components/conform-search-field"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformSearchFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ query: string }> defaultValue={{ query: "date picker" }}>
      {(fields) => (
        <ConformSearchField
          field={fields.query}
          label="Search"
          description="Submits with the form."
        />
      )}
    </OgForm>
  ),
}
