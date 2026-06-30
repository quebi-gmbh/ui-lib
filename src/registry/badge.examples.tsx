import { Badge, BadgeDot } from "@/components/badge"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">{children}</div>
)

export const badgeExamples: ComponentExample[] = [
  {
    title: "Intents",
    description:
      "Nine intents. Brand teal flags feature highlights; reserve the ai gradient for AI surfaces.",
    render: () => (
      <Row>
        <Badge intent="neutral">Neutral</Badge>
        <Badge intent="brand">Featured</Badge>
        <Badge intent="accent">Best value</Badge>
        <Badge intent="success">Live</Badge>
        <Badge intent="warning">Review</Badge>
        <Badge intent="danger">Overdue</Badge>
        <Badge intent="info">Info</Badge>
        <Badge intent="ai">AI match</Badge>
        <Badge intent="outline">Archived</Badge>
      </Row>
    ),
  },
  {
    title: "With dot",
    description: "Prepend a colored dot for live-state indicators — it inherits the badge text color.",
    render: () => (
      <Row>
        <Badge intent="success">
          <BadgeDot />
          Live on kiosk
        </Badge>
        <Badge intent="warning">
          <BadgeDot />
          Draft
        </Badge>
        <Badge intent="danger">
          <BadgeDot />
          Overdue
        </Badge>
      </Row>
    ),
  },
]
