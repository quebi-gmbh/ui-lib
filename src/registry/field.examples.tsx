import { Input, TextField } from "react-aria-components"
import { Description, Field, FieldError, Fieldset, Label, Legend } from "@/components/field"
import type { ComponentExample } from "./types"

const inputClass =
  "w-full rounded-quebi-sm border border-cyan-500/20 bg-quebi-bg px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-quebi-fg-subtle focus-visible:border-quebi-brand focus-visible:ring-2 focus-visible:ring-quebi-brand/50"

export const fieldExamples: ComponentExample[] = [
  {
    title: "Label and description",
    description: "A label above a control with a muted hint below.",
    render: () => (
      <TextField className="w-72">
        <Field>
          <Label>Workspace name</Label>
          <Description>This is how your team will see it.</Description>
          <Input data-slot="control" className={inputClass} placeholder="Acme Inc." />
        </Field>
      </TextField>
    ),
  },
  {
    title: "Validation error",
    description: "FieldError renders the message in red when the field is invalid.",
    render: () => (
      <TextField className="w-72" isInvalid>
        <Field>
          <Label>Email</Label>
          <Input
            data-slot="control"
            className={inputClass}
            defaultValue="not-an-email"
            type="email"
          />
          <FieldError>Please enter a valid email address.</FieldError>
        </Field>
      </TextField>
    ),
  },
  {
    title: "Disabled",
    description: "The whole field dims when the control is disabled.",
    render: () => (
      <TextField className="w-72" isDisabled>
        <Field>
          <Label>Account ID</Label>
          <Description>Assigned automatically and cannot be changed.</Description>
          <Input data-slot="control" className={inputClass} defaultValue="acct_8f31a2" />
        </Field>
      </TextField>
    ),
  },
  {
    title: "Fieldset and legend",
    description: "Group related fields under a Legend with Fieldset.",
    render: () => (
      <Fieldset className="w-72">
        <Legend>Contact details</Legend>
        <Description data-slot="text">We'll only use these to reach you.</Description>
        <TextField data-slot="control">
          <Field>
            <Label>First name</Label>
            <Input data-slot="control" className={inputClass} placeholder="Jane" />
          </Field>
        </TextField>
        <TextField data-slot="control">
          <Field>
            <Label>Last name</Label>
            <Input data-slot="control" className={inputClass} placeholder="Doe" />
          </Field>
        </TextField>
      </Fieldset>
    ),
  },
]
