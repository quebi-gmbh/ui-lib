import { useState } from "react"
import {
  ComboBox,
  ComboBoxContent,
  ComboBoxDescription,
  ComboBoxInput,
  ComboBoxItem,
  ComboBoxLabel,
  ComboBoxSection,
} from "@/components/combo-box"
import { Description, FieldError, Label } from "@/components/field"
import type { ComponentExample } from "./types"

const fruits = [
  { id: "apple", name: "Apple" },
  { id: "banana", name: "Banana" },
  { id: "blueberry", name: "Blueberry" },
  { id: "cherry", name: "Cherry" },
  { id: "grape", name: "Grape" },
  { id: "mango", name: "Mango" },
  { id: "orange", name: "Orange" },
  { id: "strawberry", name: "Strawberry" },
]

export const comboBoxExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A labelled combo box with a filterable list of options.",
    render: () => (
      <ComboBox className="max-w-xs" aria-label="Fruit">
        <Label>Favorite fruit</Label>
        <ComboBoxInput placeholder="Search fruit..." />
        <ComboBoxContent items={fruits}>
          {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ComboBox>
    ),
  },
  {
    title: "With description",
    description: "A hint rendered below the label.",
    render: () => (
      <ComboBox className="max-w-xs" aria-label="Fruit">
        <Label>Favorite fruit</Label>
        <Description>Start typing to filter the list.</Description>
        <ComboBoxInput placeholder="Search fruit..." />
        <ComboBoxContent items={fruits}>
          {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ComboBox>
    ),
  },
  {
    title: "With descriptions per item",
    render: () => (
      <ComboBox className="max-w-xs" aria-label="Plan">
        <Label>Plan</Label>
        <ComboBoxInput placeholder="Pick a plan..." />
        <ComboBoxContent>
          <ComboBoxItem id="free" textValue="Free">
            <ComboBoxLabel>Free</ComboBoxLabel>
            <ComboBoxDescription>For personal projects.</ComboBoxDescription>
          </ComboBoxItem>
          <ComboBoxItem id="pro" textValue="Pro">
            <ComboBoxLabel>Pro</ComboBoxLabel>
            <ComboBoxDescription>For growing teams.</ComboBoxDescription>
          </ComboBoxItem>
          <ComboBoxItem id="enterprise" textValue="Enterprise">
            <ComboBoxLabel>Enterprise</ComboBoxLabel>
            <ComboBoxDescription>Custom limits and support.</ComboBoxDescription>
          </ComboBoxItem>
        </ComboBoxContent>
      </ComboBox>
    ),
  },
  {
    title: "Sections",
    description: "Options grouped under headers.",
    render: () => (
      <ComboBox className="max-w-xs" aria-label="Food">
        <Label>Food</Label>
        <ComboBoxInput placeholder="Search..." />
        <ComboBoxContent>
          <ComboBoxSection title="Fruits">
            <ComboBoxItem id="apple">Apple</ComboBoxItem>
            <ComboBoxItem id="banana">Banana</ComboBoxItem>
            <ComboBoxItem id="cherry">Cherry</ComboBoxItem>
          </ComboBoxSection>
          <ComboBoxSection title="Vegetables">
            <ComboBoxItem id="carrot">Carrot</ComboBoxItem>
            <ComboBoxItem id="potato">Potato</ComboBoxItem>
            <ComboBoxItem id="spinach">Spinach</ComboBoxItem>
          </ComboBoxSection>
        </ComboBoxContent>
      </ComboBox>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <ComboBox className="max-w-xs" aria-label="Fruit" isDisabled>
        <Label>Favorite fruit</Label>
        <ComboBoxInput placeholder="Search fruit..." />
        <ComboBoxContent items={fruits}>
          {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ComboBox>
    ),
  },
  {
    title: "Validation",
    description: "Required combo box surfacing an error message.",
    render: () => (
      <ComboBox className="max-w-xs" aria-label="Fruit" isRequired isInvalid>
        <Label>Favorite fruit</Label>
        <ComboBoxInput placeholder="Search fruit..." />
        <FieldError>Please select a fruit.</FieldError>
        <ComboBoxContent items={fruits}>
          {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ComboBox>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [key, setKey] = useState<string | number | null>("mango")
        return (
          <div className="flex flex-col gap-2">
            <ComboBox
              className="max-w-xs"
              aria-label="Fruit"
              selectedKey={key}
              onSelectionChange={setKey}
              items={fruits}
            >
              <Label>Favorite fruit</Label>
              <ComboBoxInput placeholder="Search fruit..." />
              <ComboBoxContent items={fruits}>
                {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
              </ComboBoxContent>
            </ComboBox>
            <p className="text-quebi-fg-muted text-sm">Selected: {key ?? "none"}</p>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
