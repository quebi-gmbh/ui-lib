import {
  Description,
  Field,
  FieldError,
  FieldGroup,
  FieldRow,
  Fieldset,
  Label,
  Legend,
} from "@/components/field"
import { Input } from "@/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select"
import { Textarea } from "@/components/textarea"
import { TextField } from "@/components/text-field"
import type { ComponentExample } from "./types"

const countries = [
  { id: "de", name: "Germany" },
  { id: "fr", name: "France" },
  { id: "nl", name: "Netherlands" },
]

export const fieldExamples: ComponentExample[] = [
  {
    title: "Label and description",
    description:
      "The label → control → hint stack. Field spaces the parts by what they are, so a field with no description and a field with no error still agree: 6px from the label to the control, 6px from the control to the hint, 4px where a description sits directly under the label.",
    render: () => (
      <TextField className="w-72">
        <Field>
          <Label>Workspace name</Label>
          <Description>This is how your team will see it.</Description>
          <Input placeholder="Acme Inc." />
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
          <Input defaultValue="not-an-email" type="email" />
          <FieldError>Please enter a valid email address.</FieldError>
        </Field>
      </TextField>
    ),
  },
  {
    title: "Two fields on one row",
    description:
      "FieldRow puts fields side by side on one three-row grid — label, control, hint — so a textarea and a select share a label baseline and a hint baseline despite the difference in height. Below sm it is a plain stack; where subgrid is unsupported it falls back to an ordinary two-column grid.",
    render: () => (
      <FieldRow className="w-full max-w-2xl">
        <TextField>
          <Field>
            <Label>Notes</Label>
            <Textarea placeholder="Anything we should know?" />
            <Description>Markdown is fine.</Description>
          </Field>
        </TextField>
        <Select aria-label="Country" defaultSelectedKey="de">
          <Label>Country</Label>
          <SelectTrigger />
          <SelectContent items={countries}>
            {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
          </SelectContent>
          <Description>Where the workspace is billed.</Description>
        </Select>
      </FieldRow>
    ),
  },
  {
    title: "The hint row is reserved",
    description:
      "The row's third track keeps the height of one line of hint text whether or not anything is in it, so the invalid field below fills space that was already there instead of pushing the rest of the form down. Reserving it is only affordable under the subgrid, where the row is already as tall as its tallest hint.",
    render: () => (
      <FieldRow className="w-full max-w-2xl">
        <TextField>
          <Field>
            <Label>First name</Label>
            <Input placeholder="Jane" />
          </Field>
        </TextField>
        <TextField isInvalid>
          <Field>
            <Label>Last name</Label>
            <Input defaultValue="" />
            <FieldError>Required.</FieldError>
          </Field>
        </TextField>
      </FieldRow>
    ),
  },
  {
    title: "Rows down a form",
    description:
      "FieldGroup is the vertical counterpart: 24px between fields and rows, which is the same 24px FieldRow leaves between two lines of its own.",
    render: () => (
      <FieldGroup className="w-full max-w-2xl">
        <FieldRow>
          <TextField>
            <Field>
              <Label>First name</Label>
              <Input placeholder="Jane" />
            </Field>
          </TextField>
          <TextField>
            <Field>
              <Label>Last name</Label>
              <Input placeholder="Doe" />
            </Field>
          </TextField>
        </FieldRow>
        <TextField>
          <Field>
            <Label>Email</Label>
            <Input type="email" placeholder="jane@example.com" />
            <Description>We only use this to reach you.</Description>
          </Field>
        </TextField>
      </FieldGroup>
    ),
  },
  {
    title: "Fieldset and legend",
    description: "Group related fields under a Legend with Fieldset.",
    render: () => (
      <Fieldset className="w-72">
        <Legend>Contact details</Legend>
        <Description data-slot="text">We'll only use these to reach you.</Description>
        <FieldGroup>
          <TextField>
            <Field>
              <Label>First name</Label>
              <Input placeholder="Jane" />
            </Field>
          </TextField>
          <TextField>
            <Field>
              <Label>Last name</Label>
              <Input placeholder="Doe" />
            </Field>
          </TextField>
        </FieldGroup>
      </Fieldset>
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
          <Input defaultValue="acct_8f31a2" />
        </Field>
      </TextField>
    ),
  },
]
