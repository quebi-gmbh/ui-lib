import { AreaChart } from "@/components/area-chart"
import type { ChartConfig } from "@/components/chart"
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

export const areaChartExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Two teal-led series with gradient fills, an interactive legend, and a themed tooltip.",
    render: () => (
      <AreaChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Stacked",
    description: "Series stacked on top of each other to show cumulative totals.",
    render: () => (
      <AreaChart
        config={config}
        data={data}
        dataKey="month"
        type="stacked"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Percent",
    description: "Stacked areas normalized to 100% to compare relative share over time.",
    render: () => (
      <AreaChart
        config={config}
        data={data}
        dataKey="month"
        type="percent"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Solid fill, no grid",
    description: "Solid fills with grid lines hidden for a cleaner look.",
    render: () => (
      <AreaChart
        config={config}
        data={data}
        dataKey="month"
        fillType="solid"
        hideGridLines
        containerHeight={280}
      />
    ),
  },
]
