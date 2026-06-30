import { Link } from "@/components/link"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4">{children}</div>
)

export const linkExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Teal link, no underline until hover.",
    render: () => <Link href="/components/link">View the Link component</Link>,
  },
  {
    title: "Inline in text",
    description: "Sits naturally inside body copy.",
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
    title: "Disabled",
    description: "Non-interactive and dimmed.",
    render: () => (
      <Link href="/components/link" isDisabled>
        Unavailable link
      </Link>
    ),
  },
]
