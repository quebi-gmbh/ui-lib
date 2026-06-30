import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card"
import type { ComponentExample } from "./types"

export const cardExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A muted surface with the signature faint cyan border.",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader
          title="Storage upgrade"
          description="Expand your workspace with another 500 GB of fast object storage."
        />
        <CardContent className="text-sm text-quebi-fg-muted">
          Billed monthly. Cancel anytime — no long-term contract required.
        </CardContent>
        <CardFooter>
          <span className="font-sans font-bold text-2xl text-white tabular-nums">
            €9<span className="text-base font-medium text-quebi-fg-muted">/mo</span>
          </span>
        </CardFooter>
      </Card>
    ),
  },
  {
    title: "Feature",
    description: "The brand-tinted variant with a glow. Reserve it for the hero card.",
    render: () => (
      <Card variant="feature" className="max-w-sm">
        <CardHeader
          title="Unlimited Pro"
          description="Everything, everywhere, all at once. Priority support included."
        />
        <CardContent className="text-sm text-quebi-fg-muted">
          The complete quebi platform with no usage caps.
        </CardContent>
        <CardFooter>
          <span className="font-sans font-bold text-2xl text-white tabular-nums">
            €49<span className="text-base font-medium text-quebi-fg-muted">/mo</span>
          </span>
        </CardFooter>
      </Card>
    ),
  },
  {
    title: "Interactive",
    description: "Opt in to the hover lift + glow for link- or button-like cards.",
    render: () => (
      <Card interactive className="max-w-sm cursor-pointer">
        <CardHeader
          title="Open dashboard"
          description="Jump back into your projects and recent activity."
        />
      </Card>
    ),
  },
  {
    title: "With action",
    description: "CardAction pins a control to the top-right of the header.",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader title="Team members" description="3 people have access to this project.">
          <CardAction>
            <button
              type="button"
              className="rounded-quebi-sm border border-cyan-500/20 px-3 py-1.5 text-sm text-white transition-colors hover:border-quebi-brand hover:text-quebi-brand"
            >
              Invite
            </button>
          </CardAction>
        </CardHeader>
      </Card>
    ),
  },
  {
    title: "Composed manually",
    description: "Use CardTitle and CardDescription directly for full control.",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Custom layout</CardTitle>
          <CardDescription>Compose the pieces yourself when props aren't enough.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-quebi-fg-muted">
          Every sub-component accepts a className and forwards native div props.
        </CardContent>
      </Card>
    ),
  },
]
