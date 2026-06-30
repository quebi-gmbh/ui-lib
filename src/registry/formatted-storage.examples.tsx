import { FormattedStorage } from "@/components/formatted-storage"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4 text-base">{children}</div>
)

export const formattedStorageExamples: ComponentExample[] = [
  {
    title: "Gigabytes",
    description: "Values below 1024GB render as-is with a GB suffix.",
    render: () => (
      <Row>
        <FormattedStorage value={64} />
        <FormattedStorage value={128} />
        <FormattedStorage value={256} />
        <FormattedStorage value={512} />
      </Row>
    ),
  },
  {
    title: "Terabytes",
    description: "1024GB and above roll up to TB; fractional values keep one decimal.",
    render: () => (
      <Row>
        <FormattedStorage value={1024} />
        <FormattedStorage value={1536} />
        <FormattedStorage value={2048} />
        <FormattedStorage value={4096} />
      </Row>
    ),
  },
  {
    title: "Empty value",
    description: "A missing value renders nothing — the placeholder shows instead.",
    render: () => (
      <Row>
        <span className="text-quebi-fg-subtle">
          <FormattedStorage value={null} />
          {"—"}
        </span>
      </Row>
    ),
  },
  {
    title: "In context",
    description: "Composes with surrounding text via passthrough props and className.",
    render: () => (
      <Row>
        <span className="text-quebi-fg-muted">
          Storage:{" "}
          <FormattedStorage value={512} className="text-quebi-brand font-semibold" />
        </span>
      </Row>
    ),
  },
]
