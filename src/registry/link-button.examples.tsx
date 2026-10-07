import { LinkButton } from "@/components/link-button"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

const ArrowIcon = () => (
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
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

export const linkButtonExamples: ComponentExample[] = [
  {
    title: "Intents",
    description:
      "Looks like a Button, navigates like a link. Five intents share the Button's quebi styling.",
    render: () => (
      <Row>
        <LinkButton href="#" intent="primary">
          get started
        </LinkButton>
        <LinkButton href="#" intent="secondary">
          preview
        </LinkButton>
        <LinkButton href="#" intent="outline">
          docs
        </LinkButton>
        <LinkButton href="#" intent="ghost">
          learn more
        </LinkButton>
        <LinkButton href="#" intent="danger">
          leave
        </LinkButton>
      </Row>
    ),
  },
  {
    title: "Sizes",
    render: () => (
      <Row>
        <LinkButton href="#" size="xs">
          extra small
        </LinkButton>
        <LinkButton href="#" size="sm">
          small
        </LinkButton>
        <LinkButton href="#" size="md">
          default
        </LinkButton>
        <LinkButton href="#" size="lg">
          large
        </LinkButton>
        <LinkButton href="#" size="xl">
          extra large
        </LinkButton>
      </Row>
    ),
  },
  {
    title: "With icon",
    render: () => (
      <Row>
        <LinkButton href="#" intent="primary">
          continue
          <ArrowIcon />
        </LinkButton>
        <LinkButton href="#" intent="outline">
          view pricing
          <ArrowIcon />
        </LinkButton>
      </Row>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <Row>
        <LinkButton href="#" intent="primary" isDisabled>
          disabled
        </LinkButton>
        <LinkButton href="#" intent="outline" isDisabled>
          disabled
        </LinkButton>
      </Row>
    ),
  },
]
