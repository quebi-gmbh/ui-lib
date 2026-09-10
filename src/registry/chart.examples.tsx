import type { LegendPayload } from "recharts"
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

/**
 * A legend that only reports, with no click-to-filter. `ChartLegend` hands its
 * `content` the same payload the built-in `ChartLegendContent` gets, so a
 * replacement is a component that reads `payload` — not a fork of the chart.
 */
function StaticLegend({ payload }: { payload?: ReadonlyArray<LegendPayload> }) {
  if (!payload?.length) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
      {payload.map((item) => (
        <span key={String(item.dataKey)} className="flex items-center gap-2 text-quebi-fg-muted">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {config[String(item.dataKey)]?.label ?? String(item.dataKey)}
        </span>
      ))}
    </div>
  )
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
  {
    title: "Custom legend content",
    description:
      "`ChartLegend` renders whatever you give its `content`. The default is the interactive `ChartLegendContent`; this one is a plain read-only key.",
    render: () => (
      <Chart config={config} data={data} dataKey="month" containerHeight={280}>
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid />
          <XAxis />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<StaticLegend />} />
          <Line type="monotone" dataKey="desktop" stroke="var(--color-desktop)" strokeWidth={2} />
          <Line type="monotone" dataKey="mobile" stroke="var(--color-mobile)" strokeWidth={2} />
        </LineChart>
      </Chart>
    ),
  },
  {
    title: "Synchronized charts",
    description:
      "Two charts sharing a `syncId` share a hover: pointing at March in one moves the tooltip and cursor in the other, which is what makes a stack of small charts read as one picture.",
    render: () => (
      <div className="flex w-full flex-col gap-2">
        <Chart config={config} data={data} dataKey="month" containerHeight={160}>
          <LineChart data={data} syncId="quebi-traffic" accessibilityLayer>
            <CartesianGrid />
            <XAxis hide />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="desktop" stroke="var(--color-desktop)" strokeWidth={2} />
          </LineChart>
        </Chart>
        <Chart config={config} data={data} dataKey="month" containerHeight={160}>
          <BarChart data={data} syncId="quebi-traffic" accessibilityLayer>
            <CartesianGrid />
            <XAxis />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </Chart>
      </div>
    ),
  },
  {
    title: "Responsive sizing",
    description:
      "`Chart` wraps a `ResponsiveContainer`, so width always comes from the parent — never from a prop. Only the height is yours: `containerHeight`, defaulting to 370 and to 200 under the mobile breakpoint. These two charts are the same component in two grid tracks.",
    render: () => (
      <div className="grid w-full gap-4 sm:grid-cols-[2fr_1fr]">
        <Chart config={config} data={data} dataKey="month" containerHeight={220}>
          <AreaChart data={data} accessibilityLayer>
            <CartesianGrid />
            <XAxis />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
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
        <Chart config={config} data={data} dataKey="month" containerHeight={220}>
          <AreaChart data={data} accessibilityLayer>
            <CartesianGrid />
            <XAxis displayEdgeLabelsOnly />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="mobile"
              stroke="var(--color-mobile)"
              fill="var(--color-mobile)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </Chart>
      </div>
    ),
  },
]
