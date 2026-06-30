import { useState } from "react"
import { Description, FieldError, Label } from "@/components/field"
import { Input } from "@/components/input"
import { TextField } from "@/components/text-field"
import type { ComponentExample } from "./types"

export const textFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A label, input, and description composed in a single field.",
    render: () => (
      <TextField className="w-64">
        <Label>Email</Label>
        <Input type="email" placeholder="you@example.com" />
        <Description>We'll never share your email.</Description>
      </TextField>
    ),
  },
  {
    title: "Invalid",
    description: "Validation propagates from the field to the control and error message.",
    render: () => (
      <TextField className="w-64" isInvalid>
        <Label>Username</Label>
        <Input placeholder="Pick a username" />
        <FieldError>This username is already taken.</FieldError>
      </TextField>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <TextField className="w-64" isDisabled>
        <Label>API key</Label>
        <Input value="qb_live_••••••••" />
      </TextField>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState("")
        return (
          <TextField className="w-64" value={value} onChange={setValue}>
            <Label>Name</Label>
            <Input placeholder="Type your name" />
            <Description>{value ? `Hello, ${value}!` : "Start typing…"}</Description>
          </TextField>
        )
      }
      return <ControlledExample />
    },
  },
]
