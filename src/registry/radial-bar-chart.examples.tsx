import type { ChartConfig } from "@/components/chart"
import { formatNumber } from "@/components/formatted-number"
import { RadialBarChart } from "@/components/radial-bar-chart"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const browsers = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 },
  { browser: "Edge", visitors: 173 },
  { browser: "Other", visitors: 90 },
]

const browserConfig: ChartConfig = {
  visitors: { label: "Visitors" },
  Chrome: { label: "Chrome", color: "chart-1" },
  Safari: { label: "Safari", color: "chart-2" },
  Firefox: { label: "Firefox", color: "chart-3" },
  Edge: { label: "Edge", color: "chart-4" },
  Other: { label: "Other", color: "chart-5" },
}

const gauge = [{ name: "Uptime", uptime: 96.4 }]

const gaugeConfig: ChartConfig = {
  uptime: { label: "Uptime", color: "chart-1" },
}

const quarters = [
  { quarter: "Q1", direct: 120, referral: 80, search: 60 },
  { quarter: "Q2", direct: 150, referral: 96, search: 74 },
  { quarter: "Q3", direct: 132, referral: 110, search: 92 },
]

const quarterConfig: ChartConfig = {
  direct: { label: "Direct", color: "chart-1" },
  referral: { label: "Referral", color: "chart-2" },
  search: { label: "Search", color: "chart-3" },
}

export const radialBarChartExamples: ComponentExample[] = [
  {
    title: "One ring per row",
    description:
      "`colorByCategory` takes the colour from the row rather than from the series, which is what a single-series ranking wants — and it is what gives the legend, which names the rings here rather than the series, a swatch of its own. Click one to focus a ring.",
    render: () => (
      <RadialBarChart
        config={browserConfig}
        data={browsers}
        dataKey="browser"
        colorByCategory
        containerHeight={300}
      />
    ),
  },
  {
    title: "Gauge",
    description:
      "`angleDomain` fixes the scale, so one row sweeps its share of the arc instead of filling it. Without it, a lone value is always 100% of itself.",
    render: () => (
      <RadialBarChart
        config={gaugeConfig}
        data={gauge}
        dataKey="name"
        angleDomain={[0, 100]}
        innerRadius="70%"
        outerRadius="100%"
        cornerRadius={12}
        showLabel
        labelDescription="Uptime this quarter"
        valueFormatter={(value) => `${formatNumber(value, "de-DE")}%`}
        legend={false}
        containerHeight={260}
      />
    ),
  },
  {
    title: "Half gauge",
    description: "The same gauge swept over a semicircle by way of the start and end angles.",
    render: () => (
      <RadialBarChart
        config={gaugeConfig}
        data={gauge}
        dataKey="name"
        angleDomain={[0, 100]}
        startAngle={180}
        endAngle={0}
        innerRadius="70%"
        outerRadius="100%"
        cornerRadius={12}
        showLabel
        valueFormatter={(value) => `${formatNumber(value, "de-DE")}%`}
        legend={false}
        containerHeight={220}
      />
    ),
  },
  {
    title: "Stacked",
    description:
      "`type=\"stacked\"` puts every series on one ring per row, so each ring reads as a composition. A ring is no longer one colour, so the legend — which names rings, not series — has nothing to show: the tooltip names the series instead.",
    render: () => (
      <RadialBarChart
        config={quarterConfig}
        data={quarters}
        dataKey="quarter"
        type="stacked"
        showBackground={false}
        innerRadius="25%"
        legend={false}
        containerHeight={300}
      />
    ),
  },
]
