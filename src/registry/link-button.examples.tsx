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
    strokeWidth="2"
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
      "Looks like a Button, navigates like a link. Six intents share the Button's quebi styling.",
    render: () => (
      <Row>
        <LinkButton href="#" intent="primary">
          Get started
        </LinkButton>
        <LinkButton href="#" intent="secondary">
          Preview
        </LinkButton>
        <LinkButton href="#" intent="outline">
          Docs
        </LinkButton>
        <LinkButton href="#" intent="ghost">
          Learn more
        </LinkButton>
        <LinkButton href="#" intent="accent">
          Highlight
        </LinkButton>
        <LinkButton href="#" intent="danger">
          Leave
        </LinkButton>
      </Row>
    ),
  },
  {
    title: "Sizes",
    render: () => (
      <Row>
        <LinkButton href="#" size="xs">
          Extra small
        </LinkButton>
        <LinkButton href="#" size="sm">
          Small
        </LinkButton>
        <LinkButton href="#" size="md">
          Default
        </LinkButton>
        <LinkButton href="#" size="lg">
          Large
        </LinkButton>
        <LinkButton href="#" size="xl">
          Extra large
        </LinkButton>
      </Row>
    ),
  },
  {
    title: "With icon",
    render: () => (
      <Row>
        <LinkButton href="#" intent="primary">
          Continue
          <ArrowIcon />
        </LinkButton>
        <LinkButton href="#" intent="outline">
          View pricing
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
          Disabled
        </LinkButton>
        <LinkButton href="#" intent="outline" isDisabled>
          Disabled
        </LinkButton>
      </Row>
    ),
  },
]
