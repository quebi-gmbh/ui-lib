import { useState } from "react"
import { Checkbox, CheckboxGroup } from "@/components/checkbox"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-start gap-3">{children}</div>
)

export const checkboxExamples: ComponentExample[] = [
  {
    title: "States",
    description: "Default, selected, indeterminate, invalid, and disabled.",
    render: () => (
      <Col>
        <Checkbox>Unchecked</Checkbox>
        <Checkbox defaultSelected>Checked</Checkbox>
        <Checkbox isIndeterminate>Indeterminate</Checkbox>
        <Checkbox isInvalid>Invalid</Checkbox>
        <Checkbox isDisabled>Disabled</Checkbox>
        <Checkbox isDisabled defaultSelected>
          Disabled checked
        </Checkbox>
      </Col>
    ),
  },
  {
    title: "Group",
    description: "Several related checkboxes with CheckboxGroup.",
    render: () => (
      <CheckboxGroup defaultValue={["email"]} aria-label="Notifications">
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">SMS</Checkbox>
        <Checkbox value="push">Push</Checkbox>
      </CheckboxGroup>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [selected, setSelected] = useState(true)
        return (
          <Checkbox isSelected={selected} onChange={setSelected}>
            {selected ? "On" : "Off"}
          </Checkbox>
        )
      }
      return <ControlledExample />
    },
  },
]
