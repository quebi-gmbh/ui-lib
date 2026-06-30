import { Button } from "@/components/button"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
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
    <path d="M12 2l2.4 5 5.6.8-4 4 1 5.6L12 15l-5 2.4 1-5.6-4-4 5.6-.8z" />
  </svg>
)

export const buttonExamples: ComponentExample[] = [
  {
    title: "Intents",
    description: "Six intents. Teal primary is the single hero CTA; reach for the others to deprioritize.",
    render: () => (
      <Row>
        <Button intent="primary">Get started</Button>
        <Button intent="secondary">Preview</Button>
        <Button intent="outline">Cancel</Button>
        <Button intent="ghost">Dismiss</Button>
        <Button intent="accent">Highlight</Button>
        <Button intent="danger">Delete</Button>
      </Row>
    ),
  },
  {
    title: "Sizes",
    render: () => (
      <Row>
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="xl">Extra large</Button>
      </Row>
    ),
  },
  {
    title: "With icon",
    render: () => (
      <Row>
        <Button intent="primary">
          <StarIcon />
          Run match
        </Button>
        <Button intent="outline">
          <StarIcon />
          Favorite
        </Button>
      </Row>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <Row>
        <Button intent="primary" isDisabled>
          Disabled
        </Button>
        <Button intent="outline" isDisabled>
          Disabled
        </Button>
      </Row>
    ),
  },
]
