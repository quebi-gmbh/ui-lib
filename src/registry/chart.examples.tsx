import { Area, AreaChart, Bar, BarChart, Line, LineChart } from "recharts"
import {
  CartesianGrid,
  Chart,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  YAxis,
} from "@/components/chart"
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

export const chartExamples: ComponentExample[] = [
  {
    title: "Line",
    description: "A line chart with two teal-led series, an interactive legend, and a tooltip.",
    render: () => (
      <Chart config={config} data={data} dataKey="month" containerHeight={280}>
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid />
          <XAxis />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="desktop" stroke="var(--color-desktop)" strokeWidth={2} />
          <Line type="monotone" dataKey="mobile" stroke="var(--color-mobile)" strokeWidth={2} />
        </LineChart>
      </Chart>
    ),
  },
  {
    title: "Bar",
    description: "Grouped bars sharing the same config and tooltip.",
    render: () => (
      <Chart config={config} data={data} dataKey="month" containerHeight={280}>
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid />
          <XAxis />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </Chart>
    ),
  },
  {
    title: "Area",
    description: "A filled area chart using the brand teal as the primary series.",
    render: () => (
      <Chart config={config} data={data} dataKey="month" containerHeight={280}>
        <AreaChart data={data} accessibilityLayer>
          <CartesianGrid />
          <XAxis />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="desktop"
            stroke="var(--color-desktop)"
            fill="var(--color-desktop)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </Chart>
    ),
  },
]
