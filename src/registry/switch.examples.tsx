import { useState } from "react"
import { Switch } from "@/components/switch"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-start gap-3">{children}</div>
)

export const switchExamples: ComponentExample[] = [
  {
    title: "States",
    description: "Off, on, and disabled.",
    render: () => (
      <Col>
        <Switch>Off</Switch>
        <Switch defaultSelected>On</Switch>
        <Switch isDisabled>Disabled</Switch>
        <Switch isDisabled defaultSelected>
          Disabled on
        </Switch>
      </Col>
    ),
  },
  {
    title: "Without label",
    description: "The toggle on its own.",
    render: () => <Switch aria-label="Notifications" />,
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [selected, setSelected] = useState(true)
        return (
          <Switch isSelected={selected} onChange={setSelected}>
            {selected ? "Enabled" : "Disabled"}
          </Switch>
        )
      }
      return <ControlledExample />
    },
  },
]
