import type { Meta, StoryObj } from "@storybook/react-vite"
import { ConformColorSwatchPickerExample } from "./conform-color-swatch-picker.example"

const meta = {
  title: "UI/ConformColorSwatchPicker",
  component: ConformColorSwatchPickerExample,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A color swatch picker integrated with Conform for selecting device colors. Provides a visual interface for choosing from predefined device colors with automatic color name normalization for consistency.",
      },
    },
  },
  argTypes: {},
} satisfies Meta<typeof ConformColorSwatchPickerExample>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  render: (args) => <ConformColorSwatchPickerExample {...args} />,
}
