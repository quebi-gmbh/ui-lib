import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Form, TextField } from "react-aria-components"
import { Description, FieldError, Label } from "./field"
import { Input, InputGroup } from "./input"

const meta = {
  title: "UI/Field",
  component: TextField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isRequired: {
      control: "boolean",
      description: "Whether the field is required",
    },
    isDisabled: {
      control: "boolean",
      description: "Whether the field is disabled",
    },
    isReadOnly: {
      control: "boolean",
      description: "Whether the field is read-only",
    },
    isInvalid: {
      control: "boolean",
      description: "Whether the field is in an invalid state",
    },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <TextField {...args} className="w-80">
      <Label>Email</Label>
      <InputGroup>
        <Input placeholder="you@example.com" />
      </InputGroup>
    </TextField>
  ),
}

export const WithDescription: Story = {
  render: (args) => (
    <TextField {...args} className="w-80">
      <Label>Email</Label>
      <InputGroup>
        <Input placeholder="you@example.com" />
      </InputGroup>
      <Description>We'll never share your email with anyone else.</Description>
    </TextField>
  ),
}

export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = useState("")
    const isInvalid = value.length > 0 && !value.includes("@")

    return (
      <TextField className="w-80" isInvalid={isInvalid} value={value} onChange={setValue}>
        <Label>Email</Label>
        <InputGroup>
          <Input placeholder="you@example.com" />
        </InputGroup>
        {isInvalid && <FieldError>Please enter a valid email address</FieldError>}
      </TextField>
    )
  },
}

export const Required: Story = {
  render: () => (
    <Form className="w-80">
      <TextField isRequired>
        <Label>Email</Label>
        <InputGroup>
          <Input placeholder="you@example.com" />
        </InputGroup>
        <FieldError>Email is required</FieldError>
      </TextField>
    </Form>
  ),
}

export const Disabled: Story = {
  render: () => (
    <TextField className="w-80" isDisabled>
      <Label>Email</Label>
      <InputGroup>
        <Input placeholder="you@example.com" />
      </InputGroup>
      <Description>This field is disabled</Description>
    </TextField>
  ),
}

export const ReadOnly: Story = {
  render: () => (
    <TextField className="w-80" isReadOnly defaultValue="john@example.com">
      <Label>Email</Label>
      <InputGroup>
        <Input />
      </InputGroup>
      <Description>This field is read-only</Description>
    </TextField>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <TextField className="w-80">
      <Label>Search</Label>
      <InputGroup>
        <svg
          data-slot="icon"
          className="size-4"
          fill="none"
          strokeWidth="1.5"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <Input placeholder="Search..." />
      </InputGroup>
    </TextField>
  ),
}

export const WithTrailingIcon: Story = {
  render: () => (
    <TextField className="w-80">
      <Label>Password</Label>
      <InputGroup>
        <Input type="password" placeholder="Enter password" />
        <button type="button" className="p-1">
          <svg
            data-slot="icon"
            className="size-4"
            fill="none"
            strokeWidth="1.5"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </InputGroup>
    </TextField>
  ),
}

export const DifferentTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <TextField className="w-80">
        <Label>Text</Label>
        <InputGroup>
          <Input type="text" placeholder="Enter text" />
        </InputGroup>
      </TextField>

      <TextField className="w-80">
        <Label>Email</Label>
        <InputGroup>
          <Input type="email" placeholder="you@example.com" />
        </InputGroup>
      </TextField>

      <TextField className="w-80">
        <Label>Password</Label>
        <InputGroup>
          <Input type="password" placeholder="Enter password" />
        </InputGroup>
      </TextField>

      <TextField className="w-80">
        <Label>Number</Label>
        <InputGroup>
          <Input type="number" placeholder="Enter number" />
        </InputGroup>
      </TextField>

      <TextField className="w-80">
        <Label>Tel</Label>
        <InputGroup>
          <Input type="tel" placeholder="+1 (555) 000-0000" />
        </InputGroup>
      </TextField>

      <TextField className="w-80">
        <Label>URL</Label>
        <InputGroup>
          <Input type="url" placeholder="https://example.com" />
        </InputGroup>
      </TextField>
    </div>
  ),
}

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <TextField className="w-80">
        <Label>Default</Label>
        <InputGroup>
          <Input placeholder="Default field" />
        </InputGroup>
      </TextField>

      <TextField className="w-80" isDisabled>
        <Label>Disabled</Label>
        <InputGroup>
          <Input placeholder="Disabled field" />
        </InputGroup>
      </TextField>

      <TextField className="w-80" isReadOnly defaultValue="Read-only value">
        <Label>Read-only</Label>
        <InputGroup>
          <Input />
        </InputGroup>
      </TextField>

      <TextField className="w-80" isInvalid>
        <Label>Invalid</Label>
        <InputGroup>
          <Input placeholder="Invalid field" />
        </InputGroup>
        <FieldError>This field has an error</FieldError>
      </TextField>

      <TextField className="w-80" isRequired>
        <Label>Required</Label>
        <InputGroup>
          <Input placeholder="Required field" />
        </InputGroup>
      </TextField>
    </div>
  ),
}
