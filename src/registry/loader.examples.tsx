import { Loader } from "@/components/loader"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6">{children}</div>
)

export const loaderExamples: ComponentExample[] = [
  {
    title: "Variants",
    description: "Two glyphs: the segmented spin (default) and a smooth ring. Both are ink by default.",
    render: () => (
      <Row>
        <Loader variant="spin" />
        <Loader variant="ring" />
      </Row>
    ),
  },
  {
    title: "Sizes",
    description: "Scale with Tailwind size utilities — the SVG inherits the box.",
    render: () => (
      <Row>
        <Loader className="size-4" />
        <Loader className="size-6" />
        <Loader className="size-8" />
        <Loader className="size-12" />
      </Row>
    ),
  },
  {
    title: "Colors",
    description: "Inherits currentColor, so any text token recolors it. Ink is the default.",
    render: () => (
      <Row>
        <Loader className="size-6 text-quebi-fg" />
        <Loader className="size-6 text-quebi-fg-muted" />
        <Loader className="size-6 text-quebi-fg-subtle" />
        <Loader variant="ring" className="size-6 text-quebi-danger" />
      </Row>
    ),
  },
  {
    title: "Inline with text",
    description: "Drop it next to a label for a pending state.",
    render: () => (
      <span className="inline-flex items-center gap-2 text-sm text-quebi-fg-muted">
        <Loader className="size-4" />
        Loading your workspace…
      </span>
    ),
  },
]
