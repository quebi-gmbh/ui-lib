import { Badge, BadgeDot } from "@/components/badge"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">{children}</div>
)

export const badgeExamples: ComponentExample[] = [
  {
    title: "Intents",
    description:
      "Nine intents, one hue-free tag. Only the three states take a colour; ai is the slate fill, outline a hairline.",
    render: () => (
      <Row>
        <Badge intent="neutral">neutral</Badge>
        <Badge intent="brand">featured</Badge>
        <Badge intent="accent">best value</Badge>
        <Badge intent="success">live</Badge>
        <Badge intent="warning">review</Badge>
        <Badge intent="danger">overdue</Badge>
        <Badge intent="info">info</Badge>
        <Badge intent="ai">ai match</Badge>
        <Badge intent="outline">archived</Badge>
      </Row>
    ),
  },
  {
    title: "With dot",
    description: "Prepend a dot for live-state indicators — it inherits the badge text colour.",
    render: () => (
      <Row>
        <Badge intent="success">
          <BadgeDot />
          live on kiosk
        </Badge>
        <Badge intent="warning">
          <BadgeDot />
          draft
        </Badge>
        <Badge intent="danger">
          <BadgeDot />
          overdue
        </Badge>
      </Row>
    ),
  },
]
