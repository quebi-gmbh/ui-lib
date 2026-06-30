import { Search } from "lucide-react"
import { useState } from "react"
import { Input, InputGroup } from "@/components/input"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full max-w-xs flex-col items-stretch gap-3">{children}</div>
)

export const inputExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A basic text input with placeholder.",
    render: () => <Input aria-label="Name" placeholder="Enter your name" className="max-w-xs" />,
  },
  {
    title: "States",
    description: "Default, invalid, and disabled.",
    render: () => (
      <Col>
        <Input aria-label="Default" placeholder="Default" />
        <Input aria-label="Invalid" placeholder="Invalid" required defaultValue="" aria-invalid />
        <Input aria-label="Disabled" placeholder="Disabled" disabled />
        <Input aria-label="Disabled with value" defaultValue="Read only-ish" disabled />
      </Col>
    ),
  },
  {
    title: "Types",
    description: "Email, password, and search inputs.",
    render: () => (
      <Col>
        <Input type="email" aria-label="Email" placeholder="you@example.com" />
        <Input type="password" aria-label="Password" placeholder="Password" />
        <Input type="search" aria-label="Search" placeholder="Search" />
      </Col>
    ),
  },
  {
    title: "With icon",
    description: "InputGroup with a leading icon adornment.",
    render: () => (
      <InputGroup className="max-w-xs">
        <Search data-slot="icon" />
        <Input type="search" aria-label="Search" placeholder="Search components" />
      </InputGroup>
    ),
  },
  {
    title: "With text addon",
    description: "InputGroup with a trailing unit label.",
    render: () => (
      <InputGroup className="max-w-xs">
        <Input type="number" aria-label="Weight" placeholder="0" />
        <span data-slot="text" className="text-sm">
          kg
        </span>
      </InputGroup>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState("")
        return (
          <Col>
            <Input
              aria-label="Controlled"
              placeholder="Type something"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-sm text-quebi-fg-muted">You typed: {value || "nothing yet"}</p>
          </Col>
        )
      }
      return <ControlledExample />
    },
  },
]
