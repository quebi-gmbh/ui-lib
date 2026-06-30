import { Line } from "recharts"
import { type ChartConfig } from "@/components/chart"
import { LineChart } from "@/components/line-chart"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const data = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 173, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 264, mobile: 140 },
]

const config: ChartConfig = {
  desktop: { label: "Desktop", color: "chart-1" },
  mobile: { label: "Mobile", color: "chart-2" },
}

const singleConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "chart-1" },
}

export const lineChartExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "A config-driven line chart with two teal-led series, an interactive legend, and a tooltip.",
    render: () => (
      <LineChart config={config} data={data} dataKey="month" containerHeight={280} />
    ),
  },
  {
    title: "Single series",
    description: "One brand-teal line driven entirely by the config.",
    render: () => (
      <LineChart config={singleConfig} data={data} dataKey="month" containerHeight={280} />
    ),
  },
  {
    title: "No grid lines",
    description: "Hide the cartesian grid for a cleaner surface.",
    render: () => (
      <LineChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={280}
        hideGridLines
      />
    ),
  },
  {
    title: "Edge labels only",
    description: "Show only the first and last X-axis labels for dense series.",
    render: () => (
      <LineChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={280}
        displayEdgeLabelsOnly
      />
    ),
  },
  {
    title: "Custom series via children",
    description:
      "Pass children to take full manual control of the rendered lines while keeping the styled wrapper.",
    render: () => (
      <LineChart config={config} data={data} dataKey="month" containerHeight={280}>
        <Line
          type="monotone"
          dataKey="desktop"
          stroke="var(--color-desktop)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="mobile"
          stroke="var(--color-mobile)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    ),
  },
]
