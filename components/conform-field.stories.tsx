import type { Meta, StoryObj } from "@storybook/react-vite"
import { ConformFieldExample } from "./conform-field.example"

const meta = {
  title: "UI/ConformField",
  component: ConformFieldExample,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A wrapper component for form fields that handles Conform field metadata, labels, and error states with proper accessibility attributes.",
      },
    },
  },
  argTypes: {},
} satisfies Meta<typeof ConformFieldExample>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  render: (args) => <ConformFieldExample {...args} />,
}
