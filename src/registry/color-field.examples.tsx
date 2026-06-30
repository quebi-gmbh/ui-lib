import { parseColor } from "react-aria-components"
import { useState } from "react"
import { ColorField } from "@/components/color-field"
import { Description, FieldError, Label } from "@/components/field"
import type { ComponentExample } from "./types"

export const colorFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A standalone hex color input.",
    render: () => (
      <ColorField aria-label="Color" defaultValue="#0EA5E9" className="max-w-xs" />
    ),
  },
  {
    title: "With label and description",
    render: () => (
      <ColorField defaultValue="#22D3EE" className="max-w-xs">
        <Label>Brand color</Label>
        <Description>Enter a hex value like #22D3EE.</Description>
      </ColorField>
    ),
  },
  {
    title: "Invalid",
    description: "Validation surfaces through FieldError.",
    render: () => (
      <ColorField isInvalid className="max-w-xs">
        <Label>Accent color</Label>
        <FieldError>Please enter a valid hex color.</FieldError>
      </ColorField>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <ColorField isDisabled defaultValue="#64748B" className="max-w-xs">
        <Label>Color</Label>
      </ColorField>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState(parseColor("#10B981"))
        return (
          <div className="flex max-w-xs flex-col gap-3">
            <ColorField value={value} onChange={(c) => c && setValue(c)}>
              <Label>Color</Label>
            </ColorField>
            <div className="flex items-center gap-2 text-sm text-quebi-fg-muted">
              <span
                className="size-5 rounded-quebi-sm border border-cyan-500/20"
                style={{ background: value.toString("hex") }}
              />
              {value.toString("hex")}
            </div>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
