import type { ChartConfig } from "@/components/chart"
import { formatNumber } from "@/components/formatted-number"
import { Treemap, type TreemapDatum } from "@/components/treemap"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const flat: TreemapDatum[] = [
  { name: "Components", size: 4820 },
  { name: "Routes", size: 2410 },
  { name: "Registry", size: 1870 },
  { name: "Rules", size: 1340 },
  { name: "Scripts", size: 760 },
  { name: "Tests", size: 640 },
]

const nested: TreemapDatum[] = [
  {
    name: "Forms",
    children: [
      { name: "Input", size: 620 },
      { name: "Select", size: 540 },
      { name: "Checkbox", size: 310 },
      { name: "Switch", size: 240 },
    ],
  },
  {
    name: "Overlays",
    children: [
      { name: "Dialog", size: 480 },
      { name: "Popover", size: 320 },
      { name: "Drawer", size: 260 },
    ],
  },
  {
    name: "Charts",
    children: [
      { name: "Chart", size: 690 },
      { name: "Bar", size: 210 },
      { name: "Line", size: 180 },
      { name: "Pie", size: 160 },
    ],
  },
  {
    name: "Display",
    children: [
      { name: "Table", size: 520 },
      { name: "Card", size: 190 },
      { name: "Badge", size: 120 },
    ],
  },
]

const emptyConfig: ChartConfig = {}

const brandedConfig: ChartConfig = {
  Charts: { label: "Charts", color: "chart-1" },
  Forms: { label: "Forms", color: "chart-3" },
  Overlays: { label: "Overlays", color: "chart-5" },
  Display: { label: "Display", color: "chart-4" },
}

export const treemapExamples: ComponentExample[] = [
  {
    title: "Flat",
    description:
      "A single level of leaves, each taking the next hue from the palette. Area is the value.",
    render: () => (
      <Treemap config={emptyConfig} data={flat} dataKey="size" containerHeight={300} />
    ),
  },
  {
    title: "Nested",
    description:
      "A node with `children` is a branch: it is drawn as a frame around its leaves, and every leaf inherits the branch's hue, so colour says which branch and nesting says how deep.",
    render: () => (
      <Treemap
        config={emptyConfig}
        data={nested}
        dataKey="size"
        nodeInset={14}
        nodeGap={2}
        containerHeight={320}
      />
    ),
  },
  {
    title: "Values and branch colours",
    description:
      "`showValues` labels each leaf with its value through `valueFormatter` — a string context, so `formatNumber(value, locale)` rather than a bare `toLocaleString()`. A `config` entry named after a branch overrides that branch's hue.",
    render: () => (
      <Treemap
        config={brandedConfig}
        data={nested}
        dataKey="size"
        nodeInset={14}
        showValues
        valueFormatter={(value) => formatNumber(value, "de-DE")}
        containerHeight={320}
      />
    ),
  },
]
