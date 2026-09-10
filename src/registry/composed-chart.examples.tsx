import { ReferenceLine } from "recharts"
import type { ChartConfig } from "@/components/chart"
import { ComposedChart, type ComposedSeries } from "@/components/composed-chart"
import { formatNumber } from "@/components/formatted-number"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const data = [
  { month: "Jan", revenue: 18600, orders: 186, refunds: 24, conversion: 3.2 },
  { month: "Feb", revenue: 30500, orders: 305, refunds: 41, conversion: 4.1 },
  { month: "Mar", revenue: 23700, orders: 237, refunds: 18, conversion: 3.6 },
  { month: "Apr", revenue: 17300, orders: 173, refunds: 31, conversion: 2.8 },
  { month: "May", revenue: 20900, orders: 209, refunds: 22, conversion: 3.4 },
  { month: "Jun", revenue: 26400, orders: 264, refunds: 15, conversion: 4.6 },
]

const config: ChartConfig = {
  revenue: { label: "Revenue", color: "chart-1" },
  orders: { label: "Orders", color: "chart-2" },
  refunds: { label: "Refunds", color: "chart-5" },
  conversion: { label: "Conversion %", color: "chart-4" },
}

const barAndLine: ComposedSeries[] = [
  { key: "revenue", type: "bar" },
  { key: "orders", type: "line" },
]

const dualAxis: ComposedSeries[] = [
  { key: "revenue", type: "bar", yAxisId: "left" },
  { key: "conversion", type: "line", yAxisId: "right" },
]

const allThree: ComposedSeries[] = [
  { key: "revenue", type: "area" },
  { key: "orders", type: "bar" },
  { key: "conversion", type: "line", yAxisId: "right" },
]

const stackedWithTotal: ComposedSeries[] = [
  { key: "orders", type: "bar", stackId: "volume" },
  { key: "refunds", type: "bar", stackId: "volume" },
  { key: "revenue", type: "line", yAxisId: "right" },
]

const euros = (value: number) => `€${formatNumber(value, "de-DE")}`
const percent = (value: number) => `${formatNumber(value, "de-DE")}%`

// `formatNumber` rounds to whole numbers, so the rate axis is given whole-number
// ticks to format rather than whatever nice-looking fractions recharts would
// otherwise pick and this formatter would then flatten.
const rateAxis = { width: 48, domain: [0, 6] as [number, number], ticks: [0, 2, 4, 6] }

export const composedChartExamples: ComponentExample[] = [
  {
    title: "Bar and line",
    description:
      "Two series on one axis, drawn with different marks. The list in `series` says which key is which — order does not matter, lines are always drawn over bars.",
    render: () => (
      <ComposedChart
        config={config}
        data={data}
        dataKey="month"
        series={barAndLine}
        containerHeight={280}
      />
    ),
  },
  {
    title: "Dual Y axis",
    description:
      "A series measured against its own right-hand axis. The second axis is rendered only because a series asked for it, and each axis formats its own ticks.",
    render: () => (
      <ComposedChart
        config={config}
        data={data}
        dataKey="month"
        series={dualAxis}
        valueFormatter={euros}
        rightValueFormatter={percent}
        rightYAxisProps={rateAxis}
        containerHeight={280}
      />
    ),
  },
  {
    title: "Area, bar and line",
    description: "All three marks together, with the rate series on the right-hand axis.",
    render: () => (
      <ComposedChart
        config={config}
        data={data}
        dataKey="month"
        series={allThree}
        valueFormatter={(value) => formatNumber(value, "de-DE")}
        rightValueFormatter={percent}
        rightYAxisProps={rateAxis}
        containerHeight={280}
      />
    ),
  },
  {
    title: "Stacked bars with a target line",
    description:
      "Bars sharing a `stackId` stack together — orders and refunds are one column — while the line reads against the right-hand axis. `overlays` adds the reference line beside the generated series instead of replacing them.",
    render: () => (
      <ComposedChart
        config={config}
        data={data}
        dataKey="month"
        series={stackedWithTotal}
        valueFormatter={(value) => formatNumber(value, "de-DE")}
        rightValueFormatter={euros}
        rightYAxisProps={{ width: 64 }}
        overlays={
          <ReferenceLine
            y={250}
            yAxisId="left"
            stroke="var(--color-quebi-fg-muted)"
            strokeDasharray="4 4"
            label={{ value: "Target", position: "insideTopLeft", fill: "var(--color-quebi-fg-muted)" }}
          />
        }
        containerHeight={280}
      />
    ),
  },
]
