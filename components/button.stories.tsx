import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"

const meta = {
  title: "Cellestial DS/Components/Buttons",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    intent: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "accent", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "kiosk", "sq-xs", "sq-sm", "sq-md", "sq-lg"],
    },
    isDisabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-[10px] items-center">{children}</div>
)

const StarIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <title>Star</title>
    <path d="M12 2l2.4 5 5.6.8-4 4 1 5.6L12 15l-5 2.4 1-5.6-4-4 5.6-.8z" />
  </svg>
)

const PlusIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <title>Plus</title>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const BackIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <title>Back</title>
    <path d="M4 12h16M10 6l-6 6 6 6" />
  </svg>
)

export const Variants: Story = {
  render: () => (
    <Row>
      <Button intent="primary">Publish changes</Button>
      <Button intent="secondary">Preview kiosk</Button>
      <Button intent="outline">Cancel</Button>
      <Button intent="ghost">Dismiss</Button>
      <Button intent="accent">Start match</Button>
      <Button intent="danger">Delete plan</Button>
      <Button intent="primary" isDisabled>
        Disabled
      </Button>
    </Row>
  ),
}

export const Sizes: Story = {
  render: () => (
    <Row>
      <Button intent="primary" size="sm">
        Small (32)
      </Button>
      <Button intent="primary" size="md">
        Default (40)
      </Button>
      <Button intent="primary" size="lg">
        Large (48)
      </Button>
      <Button intent="primary" size="xl">
        Extra large (56)
      </Button>
    </Row>
  ),
}

export const KioskSize: Story = {
  parameters: {
    backgrounds: {
      default: "tint",
      values: [{ name: "tint", value: "linear-gradient(180deg, #F7EDFF, #FFFFFF)" }],
    },
  },
  render: () => (
    <Row>
      <Button intent="primary" size="kiosk">
        Find my plan
      </Button>
      <Button intent="outline" size="kiosk">
        Start over
      </Button>
    </Row>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Row>
      <Button intent="primary">
        <StarIcon />
        Run match
      </Button>
      <Button intent="outline">
        <PlusIcon />
        Add plan
      </Button>
      <Button intent="ghost">
        <BackIcon />
        Back
      </Button>
    </Row>
  ),
}

export const Playground: Story = {
  args: {
    intent: "primary",
    size: "md",
    children: "Publish changes",
  },
}
