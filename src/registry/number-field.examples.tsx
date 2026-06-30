import { useState } from "react"
import { Description, FieldError, Label } from "@/components/field"
import { NumberField, NumberInput } from "@/components/number-field"
import type { ComponentExample } from "./types"

export const numberFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Label, control with steppers, and a hint.",
    render: () => (
      <NumberField defaultValue={4} minValue={0} className="max-w-xs">
        <Label>Quantity</Label>
        <NumberInput />
        <Description>How many seats to add.</Description>
      </NumberField>
    ),
  },
  {
    title: "Prefix & suffix",
    description: "Addons attached to the edges read as one unified control.",
    render: () => (
      <div className="flex max-w-xs flex-col gap-6">
        <NumberField
          defaultValue={29.99}
          minValue={0}
          formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        >
          <Label>Monthly price</Label>
          <NumberInput prefix="£" />
          <Description>VAT inclusive.</Description>
        </NumberField>

        <NumberField defaultValue={50} minValue={0}>
          <Label>Data allowance</Label>
          <NumberInput suffix="GB" />
          <Description>Enter 0 for unlimited.</Description>
        </NumberField>
      </div>
    ),
  },
  {
    title: "Without steppers",
    description: "Hide the increment / decrement buttons for free-form entry.",
    render: () => (
      <NumberField defaultValue={1024} minValue={0} className="max-w-xs">
        <Label>Port</Label>
        <NumberInput hideStepper />
      </NumberField>
    ),
  },
  {
    title: "Invalid",
    description: "Validation styling with an error message.",
    render: () => (
      <NumberField defaultValue={120} maxValue={100} isInvalid className="max-w-xs">
        <Label>Discount</Label>
        <NumberInput suffix="%" />
        <FieldError>Must be 100 or less.</FieldError>
      </NumberField>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <NumberField defaultValue={3} isDisabled className="max-w-xs">
        <Label>Quantity</Label>
        <NumberInput />
      </NumberField>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState(8)
        return (
          <NumberField value={value} onChange={setValue} minValue={0} className="max-w-xs">
            <Label>Value is {Number.isNaN(value) ? "—" : value}</Label>
            <NumberInput />
          </NumberField>
        )
      }
      return <ControlledExample />
    },
  },
]
