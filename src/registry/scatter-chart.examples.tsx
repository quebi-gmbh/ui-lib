import type { ChartConfig } from "@/components/chart"
import { formatNumber } from "@/components/formatted-number"
import { ScatterChart, type ScatterSeries } from "@/components/scatter-chart"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const measurements = [
  { height: 161, weight: 55, spread: 4, score: 240 },
  { height: 167, weight: 62, spread: 6, score: 290 },
  { height: 170, weight: 68, spread: 3, score: 200 },
  { height: 175, weight: 71, spread: 5, score: 340 },
  { height: 179, weight: 78, spread: 7, score: 260 },
  { height: 183, weight: 82, spread: 4, score: 410 },
  { height: 188, weight: 91, spread: 6, score: 320 },
  { height: 193, weight: 99, spread: 8, score: 380 },
]

const evening = [
  { height: 158, weight: 51, spread: 5, score: 180 },
  { height: 165, weight: 58, spread: 4, score: 220 },
  { height: 172, weight: 64, spread: 6, score: 300 },
  { height: 178, weight: 70, spread: 3, score: 260 },
  { height: 185, weight: 80, spread: 7, score: 350 },
  { height: 190, weight: 88, spread: 5, score: 300 },
]

const singleConfig: ChartConfig = {
  morning: { label: "Morning cohort", color: "chart-1" },
}

const config: ChartConfig = {
  morning: { label: "Morning cohort", color: "chart-1" },
  evening: { label: "Evening cohort", color: "chart-3" },
}

const series: ScatterSeries[] = [
  { name: "morning", data: measurements },
  { name: "evening", data: evening },
]

const centimetres = (value: number) => `${formatNumber(value, "de-DE")} cm`

export const scatterChartExamples: ComponentExample[] = [
  {
    title: "Single series",
    description:
      "One cloud of points from `data`, with `dataKey` naming the X value and `yKey` the Y value.",
    render: () => (
      <ScatterChart
        config={singleConfig}
        data={measurements}
        dataKey="height"
        yKey="weight"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Two series",
    description:
      "Scatter series do not share rows, so each one carries its own points. The legend still focuses a single series on click.",
    render: () => (
      <ScatterChart
        config={config}
        series={series}
        dataKey="height"
        yKey="weight"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Bubbles",
    description:
      "Adding `zKey` maps a third value onto the area of each point, spread over `zRange`.",
    render: () => (
      <ScatterChart
        config={config}
        series={series}
        dataKey="height"
        yKey="weight"
        zKey="score"
        zRange={[40, 500]}
        containerHeight={280}
      />
    ),
  },
  {
    title: "Error bars",
    description:
      "`errorBarProps` draws an error bar on every point from a key on that point — here the spread of repeat measurements.",
    render: () => (
      <ScatterChart
        config={singleConfig}
        data={measurements}
        dataKey="height"
        yKey="weight"
        errorBarProps={{ dataKey: "spread", direction: "y" }}
        containerHeight={280}
      />
    ),
  },
  {
    title: "Formatted axis ticks",
    description:
      "A `valueFormatter` runs on both axes. It returns a string, so it goes through `formatNumber(value, locale)` rather than `toLocaleString()` — the site is prerendered, and an implicit locale is a hydration bug.",
    render: () => (
      <ScatterChart
        config={singleConfig}
        data={measurements}
        dataKey="height"
        yKey="weight"
        valueFormatter={centimetres}
        yAxisProps={{ width: 56 }}
        containerHeight={280}
      />
    ),
  },
]
