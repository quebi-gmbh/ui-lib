import { Link } from "@/components/link"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4">{children}</div>
)

export const linkExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Ink, underlined at rest; the underline drops away from the text on hover.",
    render: () => <Link href="/components/link">view the link component</Link>,
  },
  {
    title: "Inline in text",
    description:
      "Sits inside body copy and takes its font. The underline is what tells it apart from the prose around it — ink against the body grey is not a cue WCAG 1.4.1 accepts on its own.",
    render: () => (
      <p className="text-quebi-fg-muted">
        Read the <Link href="/docs">documentation</Link> or browse the{" "}
        <Link href="/components">component gallery</Link> to get started.
      </p>
    ),
  },
  {
    title: "External",
    description: "http(s):, mailto:, and tel: hrefs render as a plain anchor that opens normally.",
    render: () => (
      <Row>
        <Link href="https://quebi.de" target="_blank" rel="noreferrer">
          quebi.de
        </Link>
        <Link href="mailto:hello@quebi.de">email us</Link>
        <Link href="tel:+490000000">call us</Link>
      </Row>
    ),
  },
  {
    title: "Without the underline",
    description:
      "Navigation rows and breadcrumbs are not inside a block of text, so they opt out with no-underline; the underline comes back on hover.",
    render: () => (
      <Row>
        <Link href="/components" className="no-underline">
          components
        </Link>
        <Link href="/rules" className="no-underline">
          rules
        </Link>
      </Row>
    ),
  },
  {
    title: "Call to action",
    description:
      "A standalone link that asks for something takes the Outfit link role: a lowercase verb phrase ending in an arrow.",
    render: () => (
      <Link href="/components" className="font-display text-quebi-link">
        browse the components →
      </Link>
    ),
  },
  {
    title: "Disabled",
    description: "Non-interactive and dimmed.",
    render: () => (
      <Link href="/components/link" isDisabled>
        unavailable link
      </Link>
    ),
  },
]
