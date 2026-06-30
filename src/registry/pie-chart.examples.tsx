import type { ChartConfig } from "@/components/chart"
import { PieChart } from "@/components/pie-chart"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const data = [
  { name: "Teal", value: 275 },
  { name: "Violet", value: 200 },
  { name: "Sky", value: 187 },
  { name: "Amber", value: 173 },
  { name: "Pink", value: 90 },
]

const config: ChartConfig = {
  Teal: { label: "Teal", color: "chart-1" },
  Violet: { label: "Violet", color: "chart-2" },
  Sky: { label: "Sky", color: "chart-3" },
  Amber: { label: "Amber", color: "chart-4" },
  Pink: { label: "Pink", color: "chart-5" },
}

export const pieChartExamples: ComponentExample[] = [
  {
    title: "Pie",
    description: "A pie chart with five segments colored from the teal-led quebi palette.",
    render: () => (
      <PieChart
        config={config}
        data={data}
        dataKey="value"
        nameKey="name"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Donut",
    description: "The donut variant with a hollow center and a tooltip on hover.",
    render: () => (
      <PieChart
        config={config}
        data={data}
        dataKey="value"
        nameKey="name"
        variant="donut"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Donut with total label",
    description: "A donut chart showing the summed total in the center.",
    render: () => (
      <PieChart
        config={config}
        data={data}
        dataKey="value"
        nameKey="name"
        variant="donut"
        showLabel
        containerHeight={280}
      />
    ),
  },
]
