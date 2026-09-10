import { Brush } from "recharts"
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

// A brush is only worth having when there is more data than fits, so this one
// gets a year rather than the six months the other examples use.
const year = [
  ...data,
  { month: "Jul", desktop: 291, mobile: 160 },
  { month: "Aug", desktop: 318, mobile: 205 },
  { month: "Sep", desktop: 246, mobile: 178 },
  { month: "Oct", desktop: 275, mobile: 212 },
  { month: "Nov", desktop: 332, mobile: 240 },
  { month: "Dec", desktop: 358, mobile: 268 },
]

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
  {
    title: "Brush — zoom and pan",
    description:
      "A `Brush` in `overlays` puts a draggable window under the chart: drag its edges to zoom, drag its middle to pan. It sits beside the generated areas rather than replacing them.",
    render: () => (
      <AreaChart
        config={config}
        data={year}
        dataKey="month"
        containerHeight={320}
        overlays={
          <Brush
            dataKey="month"
            height={26}
            travellerWidth={8}
            startIndex={2}
            endIndex={9}
            stroke="var(--color-quebi-brand)"
            fill="var(--color-quebi-bg)"
          />
        }
      />
    ),
  },
]
