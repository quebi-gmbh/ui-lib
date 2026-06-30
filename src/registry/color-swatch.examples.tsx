import { ColorSwatch } from "@/components/color-swatch"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

export const colorSwatchExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A single swatch filled with a color value.",
    render: () => <ColorSwatch color="#0ea5e9" aria-label="Sky blue" />,
  },
  {
    title: "Palette",
    description: "Several swatches showing different user colors.",
    render: () => (
      <Row>
        <ColorSwatch color="#ef4444" aria-label="Red" />
        <ColorSwatch color="#f59e0b" aria-label="Amber" />
        <ColorSwatch color="#10b981" aria-label="Emerald" />
        <ColorSwatch color="#3b82f6" aria-label="Blue" />
        <ColorSwatch color="#a855f7" aria-label="Purple" />
      </Row>
    ),
  },
  {
    title: "With alpha",
    description: "Transparent colors render over the inset ring.",
    render: () => (
      <Row>
        <ColorSwatch color="rgba(14, 165, 233, 1)" aria-label="Opaque" />
        <ColorSwatch color="rgba(14, 165, 233, 0.5)" aria-label="Half" />
        <ColorSwatch color="rgba(14, 165, 233, 0.15)" aria-label="Faint" />
      </Row>
    ),
  },
]
