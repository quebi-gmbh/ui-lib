import { useState } from "react"
import { Description } from "@/components/field"
import { Radio, RadioGroup } from "@/components/radio"
import type { ComponentExample } from "./types"

export const radioExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A basic radio group with several options.",
    render: () => (
      <RadioGroup defaultValue="standard" aria-label="Shipping">
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
        <Radio value="overnight">Overnight</Radio>
      </RadioGroup>
    ),
  },
  {
    title: "With descriptions",
    description: "Each option pairs a label with a muted hint.",
    render: () => (
      <RadioGroup defaultValue="pro" aria-label="Plan">
        <Radio value="free">
          <span data-slot="label">Free</span>
          <Description>For individuals getting started.</Description>
        </Radio>
        <Radio value="pro">
          <span data-slot="label">Pro</span>
          <Description>For teams that need more power.</Description>
        </Radio>
        <Radio value="enterprise">
          <span data-slot="label">Enterprise</span>
          <Description>Advanced controls and support.</Description>
        </Radio>
      </RadioGroup>
    ),
  },
  {
    title: "Invalid",
    description: "An invalid radio group uses the red accent.",
    render: () => (
      <RadioGroup isInvalid aria-label="Agreement">
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
      </RadioGroup>
    ),
  },
  {
    title: "Disabled",
    description: "Disable the whole group or a single option.",
    render: () => (
      <RadioGroup defaultValue="one" aria-label="Disabled options">
        <Radio value="one">Available</Radio>
        <Radio value="two" isDisabled>
          Unavailable
        </Radio>
        <Radio value="three">Available</Radio>
      </RadioGroup>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState<string | null>("a")
        return (
          <div className="flex flex-col items-start gap-3">
            <RadioGroup value={value} onChange={setValue} aria-label="Controlled">
              <Radio value="a">Option A</Radio>
              <Radio value="b">Option B</Radio>
            </RadioGroup>
            <p className="text-sm text-quebi-fg-muted">Selected: {value ?? "none"}</p>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
