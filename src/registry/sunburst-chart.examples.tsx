import type { ChartConfig } from "@/components/chart"
import { SunburstChart, type SunburstDatum } from "@/components/sunburst-chart"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

// Recharts wants one root node, and reads the root's own value as the full
// sweep of the circle — so the root carries the total of its children.
const traffic: SunburstDatum = {
  name: "All traffic",
  value: 1000,
  children: [
    {
      name: "Direct",
      value: 400,
      children: [
        { name: "Bookmarks", value: 240 },
        { name: "Typed", value: 160 },
      ],
    },
    {
      name: "Search",
      value: 360,
      children: [
        { name: "Organic", value: 250 },
        { name: "Paid", value: 110 },
      ],
    },
    {
      name: "Referral",
      value: 240,
      children: [
        { name: "Social", value: 140 },
        { name: "Partners", value: 100 },
      ],
    },
  ],
}

const emptyConfig: ChartConfig = {}

const brandedConfig: ChartConfig = {
  Direct: { label: "Direct", color: "chart-1" },
  Search: { label: "Search", color: "chart-3" },
  Referral: { label: "Referral", color: "chart-5" },
}

export const sunburstChartExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "The inner ring is the top-level branches; each ring outwards is one level deeper, in the branch's own hue.",
    render: () => (
      <SunburstChart config={emptyConfig} data={traffic} containerHeight={320} />
    ),
  },
  {
    title: "Branch colours from the config",
    description:
      "A `config` entry named after a branch sets that branch's hue, and its descendants inherit it.",
    render: () => (
      <SunburstChart config={brandedConfig} data={traffic} containerHeight={320} />
    ),
  },
  {
    title: "Without values",
    description:
      "Recharts prints the value inside each segment rather than the name. `hideValues` drops them and leaves the names to the tooltip.",
    render: () => (
      <SunburstChart
        config={brandedConfig}
        data={traffic}
        hideValues
        innerRadius={30}
        containerHeight={320}
      />
    ),
  },
  {
    title: "Half circle",
    description: "A start and end angle sweep the rings over half an arc instead of a full circle.",
    render: () => (
      <SunburstChart
        config={brandedConfig}
        data={traffic}
        startAngle={0}
        endAngle={180}
        innerRadius={30}
        containerHeight={280}
      />
    ),
  },
]
