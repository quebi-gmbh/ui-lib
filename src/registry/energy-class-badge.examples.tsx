import { EnergyClassBadge } from "@/components/energy-class-badge"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">{children}</div>
)

export const energyClassBadgeExamples: ComponentExample[] = [
  {
    title: "Scale",
    description: "Classes A–G on the official EU energy-label colour scale (dark-green → red).",
    render: () => (
      <Row>
        {["A", "B", "C", "D", "E", "F", "G"].map((cls) => (
          <EnergyClassBadge key={cls} energyClass={cls} />
        ))}
      </Row>
    ),
  },
  {
    title: "Sizes",
    description: "Three sizes — sm, md (default), lg.",
    render: () => (
      <Row>
        <EnergyClassBadge energyClass="A" size="sm" />
        <EnergyClassBadge energyClass="A" size="md" />
        <EnergyClassBadge energyClass="A" size="lg" />
      </Row>
    ),
  },
  {
    title: "Case & whitespace tolerant",
    description: "Input is trimmed and upper-cased before matching, so messy data still renders right.",
    render: () => (
      <Row>
        <EnergyClassBadge energyClass="b" />
        <EnergyClassBadge energyClass="  c " />
        <EnergyClassBadge energyClass="D" />
      </Row>
    ),
  },
  {
    title: "Unknown fallback",
    description:
      "Legacy or unrecognised values (e.g. A+, ?) fall back to a neutral quebi chip showing the raw text — nothing is silently dropped.",
    render: () => (
      <Row>
        <EnergyClassBadge energyClass="A+" />
        <EnergyClassBadge energyClass="A+++" />
        <EnergyClassBadge energyClass="?" />
      </Row>
    ),
  },
]
