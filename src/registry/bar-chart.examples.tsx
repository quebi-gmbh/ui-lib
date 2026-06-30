import { BarChart } from "@/components/bar-chart"
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

export const barChartExamples: ComponentExample[] = [
  {
    title: "Grouped",
    description:
      "Two teal-led series rendered side by side. Click a legend item to focus a single series.",
    render: () => (
      <BarChart config={config} data={data} dataKey="month" containerHeight={280} />
    ),
  },
  {
    title: "Stacked",
    description: "The same series stacked into a single bar per category.",
    render: () => (
      <BarChart
        config={config}
        data={data}
        dataKey="month"
        type="stacked"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Percent (100%)",
    description: "A stacked-to-100% layout that shows each series as a share of the total.",
    render: () => (
      <BarChart
        config={config}
        data={data}
        dataKey="month"
        type="percent"
        containerHeight={280}
      />
    ),
  },
  {
    title: "Single series, no legend",
    description: "A minimal bar chart with one series, the legend hidden, and grid lines removed.",
    render: () => (
      <BarChart
        config={{ desktop: { label: "Desktop", color: "chart-1" } }}
        data={data}
        dataKey="month"
        legend={false}
        hideGridLines
        containerHeight={280}
      />
    ),
  },
]
