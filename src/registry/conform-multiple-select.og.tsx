import { ConformMultipleSelect } from "@/components/conform-multiple-select"
import { MultipleSelectContent, MultipleSelectItem } from "@/components/multiple-select"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

const FRAMEWORKS = [
  { id: "react", name: "React" },
  { id: "svelte", name: "Svelte" },
  { id: "vue", name: "Vue" },
]

export const conformMultipleSelectOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ frameworks: string[] }> defaultValue={{ frameworks: ["react", "svelte"] }}>
      {(fields) => (
        <ConformMultipleSelect field={fields.frameworks} label="Frameworks">
          <MultipleSelectContent items={FRAMEWORKS}>
            {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
          </MultipleSelectContent>
        </ConformMultipleSelect>
      )}
    </OgForm>
  ),
}
