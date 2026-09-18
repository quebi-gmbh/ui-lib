import { Link } from "@/components/link"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4">{children}</div>
)

export const linkExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Teal link, underlined at rest, brightening on hover.",
    render: () => <Link href="/components/link">View the Link component</Link>,
  },
  {
    title: "Inline in text",
    description:
      "Sits inside body copy. The underline is what tells it apart from the muted prose around it — the brand colour alone is 1.38:1 against that gray, which WCAG 1.4.1 does not accept as the only cue.",
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
        <Link href="mailto:hello@quebi.de">Email us</Link>
        <Link href="tel:+490000000">Call us</Link>
      </Row>
    ),
  },
  {
    title: "Without the underline",
    description:
      "Navigation rows, breadcrumbs and standalone calls to action are not inside a block of text, so they opt out with no-underline and keep the colour-only look.",
    render: () => (
      <Row>
        <Link href="/components" className="no-underline">
          Components
        </Link>
        <Link href="/rules" className="no-underline">
          Rules
        </Link>
      </Row>
    ),
  },
  {
    title: "Disabled",
    description: "Non-interactive and dimmed.",
    render: () => (
      <Link href="/components/link" isDisabled>
        Unavailable link
      </Link>
    ),
  },
]
