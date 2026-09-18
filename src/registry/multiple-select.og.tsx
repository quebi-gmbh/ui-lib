import {
  MultipleSelect,
  MultipleSelectContent,
  MultipleSelectItem,
} from "@/components/multiple-select"
import type { OgScene } from "./types"

const FRAMEWORKS = [
  { id: "react", name: "React" },
  { id: "svelte", name: "Svelte" },
  { id: "vue", name: "Vue" },
  { id: "solid", name: "Solid" },
]

/** Two chips in the box: the tokenizer is the point, so the tokens are the scene. */
export const multipleSelectOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="w-80">
      <MultipleSelect
        aria-label="Frameworks"
        placeholder="Select frameworks"
        defaultValue={["react", "svelte"]}
      >
        <MultipleSelectContent items={FRAMEWORKS}>
          {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
        </MultipleSelectContent>
      </MultipleSelect>
    </div>
  ),
}
