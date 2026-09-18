import { useState } from "react"
import type { Key } from "react-aria-components"
import { Description, Label } from "@/components/field"
import {
  MultipleSelect,
  MultipleSelectContent,
  MultipleSelectItem,
} from "@/components/multiple-select"
import type { ComponentExample } from "./types"

interface Option {
  id: string
  name: string
}

const frameworks: Option[] = [
  { id: "react", name: "React" },
  { id: "vue", name: "Vue" },
  { id: "svelte", name: "Svelte" },
  { id: "solid", name: "Solid" },
  { id: "angular", name: "Angular" },
  { id: "qwik", name: "Qwik" },
  { id: "astro", name: "Astro" },
]

export const multipleSelectExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "A tokenizer combobox: type to filter, Enter or a click chooses, and each choice becomes a removable chip inline with the input. Clicking anywhere in the box — the padding or a chip's label — puts focus in the input and opens the list; Backspace on an empty input removes the last chip.",
    render: () => (
      <div className="w-80">
        <MultipleSelect aria-label="Frameworks" placeholder="Select frameworks">
          <MultipleSelectContent items={frameworks}>
            {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
          </MultipleSelectContent>
        </MultipleSelect>
      </div>
    ),
  },
  {
    title: "With label & description",
    description:
      "Pair the control with field primitives. This is a hand-built combobox rather than a react-aria field, so the ids are yours: point the label at the input with `htmlFor` and the input at the hint with `aria-describedby`.",
    render: () => (
      <div className="w-80 space-y-1.5">
        <Label htmlFor="frameworks">Frameworks</Label>
        <MultipleSelect
          id="frameworks"
          aria-describedby="frameworks-hint"
          placeholder="Select frameworks"
          defaultValue={["react", "svelte"]}
        >
          <MultipleSelectContent items={frameworks}>
            {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
          </MultipleSelectContent>
        </MultipleSelect>
        <Description id="frameworks-hint">Choose the frameworks your team uses.</Description>
      </div>
    ),
  },
  {
    title: "Controlled",
    description: "Drive selection from state; the live selection is shown below.",
    render: () => {
      function Demo() {
        const [selected, setSelected] = useState<Key[]>(["react"])
        const labels = frameworks.filter((f) => selected.includes(f.id)).map((f) => f.name)
        return (
          <div className="w-80 space-y-3">
            <MultipleSelect
              aria-label="Frameworks"
              placeholder="Select frameworks"
              value={selected}
              onChange={setSelected}
            >
              <MultipleSelectContent items={frameworks}>
                {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
              </MultipleSelectContent>
            </MultipleSelect>
            <p className="text-quebi-fg-muted text-sm">
              Selected: {labels.length ? labels.join(", ") : "none"}
            </p>
          </div>
        )
      }
      return <Demo />
    },
  },
  {
    title: "Disabled",
    description: "The whole control can be disabled; chips lose their ✕ with it.",
    render: () => (
      <div className="w-80">
        <MultipleSelect
          aria-label="Frameworks"
          placeholder="Select frameworks"
          defaultValue={["vue"]}
          isDisabled
        >
          <MultipleSelectContent items={frameworks}>
            {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
          </MultipleSelectContent>
        </MultipleSelect>
      </div>
    ),
  },
]
