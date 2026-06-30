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
      "Pick several options; each becomes a removable tag. Use the + button to open the searchable list.",
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
    description: "Pair the control with field primitives for a complete labelled form field.",
    render: () => (
      <div className="w-80 space-y-1.5">
        <Label>Frameworks</Label>
        <MultipleSelect
          aria-label="Frameworks"
          placeholder="Select frameworks"
          defaultValue={["react", "svelte"]}
        >
          <MultipleSelectContent items={frameworks}>
            {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
          </MultipleSelectContent>
        </MultipleSelect>
        <Description>Choose the frameworks your team uses.</Description>
      </div>
    ),
  },
  {
    title: "Controlled",
    description: "Drive selection from state; the live selection is shown below.",
    render: () => {
      function Demo() {
        const [selected, setSelected] = useState<Key[]>(["react"])
        const labels = frameworks
          .filter((f) => selected.includes(f.id))
          .map((f) => f.name)
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
    description: "The whole control can be disabled.",
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
