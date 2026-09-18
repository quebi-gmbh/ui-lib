import { parseColor } from "react-aria-components"
import { useState } from "react"
import { ColorField, ColorFieldGroup, ColorInput } from "@/components/color-field"
import { ColorSwatch } from "@/components/color-swatch"
import { Description, FieldError, Label } from "@/components/field"
import type { ComponentExample } from "./types"

export const colorFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A standalone hex color input, with a live swatch of the value.",
    render: () => (
      <ColorField aria-label="Color" defaultValue="#0EA5E9" className="max-w-xs" />
    ),
  },
  {
    title: "With label and description",
    description: "Composing children means placing the control yourself.",
    render: () => (
      <ColorField defaultValue="#22D3EE" className="max-w-xs">
        <Label>Brand color</Label>
        <ColorFieldGroup />
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
        <ColorFieldGroup />
        <FieldError>Please enter a valid hex color.</FieldError>
      </ColorField>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <ColorField isDisabled defaultValue="#64748B" className="max-w-xs">
        <Label>Color</Label>
        <ColorFieldGroup />
      </ColorField>
    ),
  },
  {
    title: "Without the swatch",
    description:
      "A bare ColorInput as the child opts out of the chip — no prop needed, because composing the control is already the opt-out.",
    render: () => (
      <ColorField defaultValue="#A855F7" className="max-w-xs">
        <Label>Color</Label>
        <ColorInput />
      </ColorField>
    ),
  },
  {
    title: "Controlled",
    description: "The field owns the chip; a standalone ColorSwatch reads the same value.",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState(parseColor("#10B981"))
        return (
          <div className="flex max-w-xs flex-col gap-3">
            <ColorField value={value} onChange={(c) => c && setValue(c)}>
              <Label>Color</Label>
              <ColorFieldGroup />
            </ColorField>
            <div className="flex items-center gap-2 text-sm text-quebi-fg-muted">
              <ColorSwatch color={value} className="size-5 sm:size-5" />
              {value.toString("hex")}
            </div>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
