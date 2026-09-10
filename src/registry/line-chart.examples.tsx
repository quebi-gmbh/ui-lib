import type { TooltipContentProps } from "recharts"
import { Line, ReferenceArea, ReferenceDot, ReferenceLine } from "recharts"
import { Card } from "@/components/card"
import type { ChartConfig } from "@/components/chart"
import { formatNumber } from "@/components/formatted-number"
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

// Recharts hands the tooltip content its props at render time, so the component
// itself needs none of them up front.
type TooltipRenderProps = Partial<TooltipContentProps<number, string>>

/**
 * A tooltip surface of your own. It is a `Card` rather than a hand-rolled div:
 * a rounded, bordered box is a surface the library already ships.
 */
function SessionsTooltip({ active, payload, label }: TooltipRenderProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <Card className="min-w-44 p-3">
      <p className="quebi-eyebrow">{String(label)}</p>
      {payload.map((item) => (
        <p
          key={String(item.dataKey)}
          className="mt-1.5 flex items-center justify-between gap-6 text-xs"
        >
          <span className="text-quebi-fg-muted">{config[String(item.dataKey)]?.label}</span>
          <span className="font-mono text-quebi-fg tabular-nums">
            {formatNumber(Number(item.value), "de-DE")} sessions
          </span>
        </p>
      ))}
    </Card>
  )
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
  {
    title: "Tooltip formatters",
    description:
      "`tooltipProps` reaches the tooltip's own `formatter` and `labelFormatter`. Both return strings or nodes, so the number goes through `formatNumber(value, locale)` — a bare `toLocaleString()` here formats against whatever locale the runtime has, which differs between the prerender and the browser.",
    render: () => (
      <LineChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={280}
        tooltipProps={{
          labelFormatter: (label) => `${String(label)} 2024`,
          formatter: (value, name) => (
            <span className="flex flex-1 items-center justify-between gap-6">
              <span className="text-quebi-fg-muted">{config[String(name)]?.label}</span>
              <span className="font-mono text-quebi-fg tabular-nums">
                {formatNumber(Number(value), "de-DE")}
              </span>
            </span>
          ),
        }}
      />
    ),
  },
  {
    title: "A tooltip surface of your own",
    description:
      "Pass an element to `tooltip` and it replaces `ChartTooltipContent` entirely — recharts clones it with the active payload.",
    render: () => (
      <LineChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={280}
        tooltip={<SessionsTooltip />}
      />
    ),
  },
  {
    title: "Reference line, area and dot",
    description:
      "`overlays` renders extra recharts children *next to* the series the config generates. Passing them as `children` would replace those series instead.",
    render: () => (
      <LineChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={280}
        overlays={
          <>
            <ReferenceArea
              x1="Mar"
              x2="Apr"
              fill="var(--color-quebi-brand)"
              fillOpacity={0.07}
            />
            <ReferenceLine
              y={220}
              stroke="var(--color-quebi-fg-muted)"
              strokeDasharray="4 4"
              label={{
                value: "Average",
                position: "insideTopRight",
                fill: "var(--color-quebi-fg-muted)",
                fontSize: 11,
              }}
            />
            <ReferenceDot
              x="Feb"
              y={305}
              r={5}
              fill="var(--color-quebi-brand)"
              stroke="var(--color-quebi-bg)"
              strokeWidth={2}
            />
          </>
        }
      />
    ),
  },
  {
    title: "Axis labels and tick formatting",
    description:
      "An axis label on each side, and a `valueFormatter` on the Y ticks. The formatter returns a string, which is why it calls `formatNumber(value, locale)` rather than a component.",
    render: () => (
      <LineChart
        config={config}
        data={data}
        dataKey="month"
        containerHeight={300}
        valueFormatter={(value) => formatNumber(value, "de-DE")}
        yAxisProps={{
          width: 64,
          label: {
            value: "Sessions",
            angle: -90,
            position: "insideLeft",
            fill: "var(--color-quebi-fg-muted)",
            fontSize: 11,
          },
        }}
        xAxisProps={{
          label: {
            value: "2024",
            position: "insideBottom",
            offset: -6,
            fill: "var(--color-quebi-fg-muted)",
            fontSize: 11,
          },
        }}
        chartProps={{ margin: { top: 5, right: 8, bottom: 20, left: 0 } }}
      />
    ),
  },
]
