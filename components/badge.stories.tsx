import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "./badge"

const meta = {
  title: "Cellestial DS/Components/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    intent: {
      control: "select",
      options: [
        "neutral",
        "brand",
        "accent",
        "success",
        "warning",
        "danger",
        "info",
        "ai",
        "outline",
      ],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-2 items-center">{children}</div>
)

export const Variants: Story = {
  render: () => (
    <Row>
      <Badge intent="neutral">Neutral</Badge>
      <Badge intent="brand">Featured</Badge>
      <Badge intent="accent">Best value</Badge>
      <Badge intent="success">Live</Badge>
      <Badge intent="warning">Review</Badge>
      <Badge intent="danger">Overdue</Badge>
      <Badge intent="info">Info</Badge>
      <Badge intent="ai">AI match</Badge>
      <Badge intent="outline">Archived</Badge>
    </Row>
  ),
}

export const WithDot: Story = {
  render: () => (
    <Row>
      <Badge intent="success">
        <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
        Live on kiosk
      </Badge>
      <Badge intent="warning">
        <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
        Draft
      </Badge>
      <Badge intent="danger">
        <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
        Overdue
      </Badge>
    </Row>
  ),
}

export const Playground: Story = {
  args: {
    intent: "brand",
    children: "Badge",
  },
}
