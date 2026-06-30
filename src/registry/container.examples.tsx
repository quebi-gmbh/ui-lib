import { Container } from "@/components/container"
import type { ComponentExample } from "./types"

const Fill = ({ label }: { label: string }) => (
  <div className="rounded-quebi-sm border border-cyan-500/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-quebi-fg-muted">
    {label}
  </div>
)

export const containerExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Centered, full-width up to the xl breakpoint with horizontal padding at every size.",
    render: () => (
      <Container>
        <Fill label="Centered content, max-width xl" />
      </Container>
    ),
  },
  {
    title: "Constrained",
    description: "Padding kicks in only from the sm breakpoint, so content runs edge-to-edge on the smallest screens.",
    render: () => (
      <Container constrained>
        <Fill label="Edge-to-edge below sm, padded above" />
      </Container>
    ),
  },
  {
    title: "Custom max-width",
    description: "Override the breakpoint variable inline to cap the content narrower.",
    render: () => (
      <Container className="[--container-breakpoint:var(--breakpoint-md)]">
        <Fill label="Capped at md" />
      </Container>
    ),
  },
]
