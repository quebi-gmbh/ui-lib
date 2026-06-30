import { useState } from "react"
import { Toggle } from "@/components/toggle"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

const BoldIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
    <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
  </svg>
)

export const toggleExamples: ComponentExample[] = [
  {
    title: "Intents",
    description: "Outline is bordered; plain is borderless. Both light up teal when selected.",
    render: () => (
      <Row>
        <Toggle intent="outline">Outline</Toggle>
        <Toggle intent="outline" defaultSelected>
          Selected
        </Toggle>
        <Toggle intent="plain">Plain</Toggle>
        <Toggle intent="plain" defaultSelected>
          Selected
        </Toggle>
      </Row>
    ),
  },
  {
    title: "Sizes",
    render: () => (
      <Row>
        <Toggle size="xs">Extra small</Toggle>
        <Toggle size="sm">Small</Toggle>
        <Toggle size="md">Default</Toggle>
        <Toggle size="lg">Large</Toggle>
      </Row>
    ),
  },
  {
    title: "Icon only",
    description: "Square sizes for toolbar-style icon toggles.",
    render: () => (
      <Row>
        <Toggle size="sq-sm" intent="outline" aria-label="Bold">
          <BoldIcon />
        </Toggle>
        <Toggle size="sq-md" intent="plain" defaultSelected aria-label="Bold">
          <BoldIcon />
        </Toggle>
      </Row>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <Row>
        <Toggle intent="outline" isDisabled>
          Disabled
        </Toggle>
        <Toggle intent="outline" isDisabled defaultSelected>
          Disabled selected
        </Toggle>
      </Row>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [selected, setSelected] = useState(false)
        return (
          <Toggle intent="outline" isSelected={selected} onChange={setSelected}>
            {selected ? "On" : "Off"}
          </Toggle>
        )
      }
      return <ControlledExample />
    },
  },
]
