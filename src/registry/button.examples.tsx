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
    strokeWidth="1.5"
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
    description:
      "Five intents. The solid primary is the one call to action on a surface; the others step down from it.",
    render: () => (
      <Row>
        <Button intent="primary">get started →</Button>
        <Button intent="secondary">preview</Button>
        <Button intent="outline">cancel</Button>
        <Button intent="ghost">dismiss</Button>
        <Button intent="danger">delete</Button>
      </Row>
    ),
  },
  {
    title: "Sizes",
    render: () => (
      <Row>
        <Button size="xs">extra small</Button>
        <Button size="sm">small</Button>
        <Button size="md">default</Button>
        <Button size="lg">large</Button>
        <Button size="xl">extra large</Button>
      </Row>
    ),
  },
  {
    title: "With icon",
    render: () => (
      <Row>
        <Button intent="primary">
          <StarIcon />
          run match
        </Button>
        <Button intent="outline">
          <StarIcon />
          favourite
        </Button>
      </Row>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <Row>
        <Button intent="primary" isDisabled>
          disabled
        </Button>
        <Button intent="outline" isDisabled>
          disabled
        </Button>
      </Row>
    ),
  },
]
