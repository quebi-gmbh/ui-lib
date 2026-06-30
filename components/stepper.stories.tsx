import type { Meta, StoryObj } from "@storybook/react-vite"
import { Stepper } from "./stepper"

/**
 * Verbatim port of the Stepper examples from cellestial-ds/showcase.html.
 *
 * Admin — 32px bullets with labels, progress lines turn brand-300 after done steps.
 * Kiosk — 28px bullets only, done shows ✓, lives in the kiosk footer.
 */

const meta = {
  title: "Cellestial DS/Components/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Stepper>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {
  args: {
    variant: "admin",
    steps: [
      { id: "details", label: "Details", status: "done" },
      { id: "pricing", label: "Pricing", status: "done" },
      { id: "visibility", label: "Visibility", status: "active" },
      { id: "review", label: "Review", status: "upcoming" },
    ],
  },
}

export const Kiosk: Story = {
  args: {
    variant: "kiosk",
    steps: [
      { id: "1", status: "done" },
      { id: "2", status: "done" },
      { id: "3", status: "active" },
      { id: "4", status: "upcoming" },
      { id: "5", status: "upcoming" },
    ],
  },
  parameters: {
    backgrounds: {
      default: "tint",
      values: [{ name: "tint", value: "linear-gradient(180deg, #F7EDFF, #FFFFFF)" }],
    },
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <Stepper {...args} />
      <p className="text-ink-500 text-[13px]">
        Kiosk steppers are compact, finger-sized (28px), and sit in the kiosk footer on every wizard
        step.
      </p>
    </div>
  ),
}
