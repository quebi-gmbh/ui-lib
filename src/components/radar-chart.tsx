"use client"

import { type ComponentProps, useMemo } from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RadarChartPrimitive,
} from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import {
  type BaseChartProps,
  Chart,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  constructCategoryColors,
  DEFAULT_COLORS,
  getColorValue,
} from "@/components/chart"

/**
 * RadarChart — quebi design system
 *
 * A polar radar (spider) chart on the quebi `Chart` wrapper. `dataKey` names the
 * axis label on every row and each key in `config` becomes one overlaid polygon,
 * colored from the teal-led quebi palette. The grid, angle axis and radius axis
 * are themed; the interactive legend focuses a single series on click.
 *
 * Requires the `recharts` npm package as a peer dependency.
 */

export interface RadarChartProps<TValue extends ValueType, TName extends NameType>
  extends Omit<
    BaseChartProps<TValue, TName>,
    | "hideGridLines"
    | "hideXAxis"
    | "hideYAxis"
    | "xAxisProps"
    | "yAxisProps"
    | "cartesianGridProps"
    | "displayEdgeLabelsOnly"
    | "intervalType"
    | "layout"
  > {
  /** Hide the web of polar grid lines. */
  hidePolarGrid?: boolean
  /** Show the numeric radius axis. Hidden by default — the web already scales. */
  showRadiusAxis?: boolean
  /** Fill opacity of each polygon. Set to 0 for outline-only radars. */
  fillOpacity?: number
  gridType?: ComponentProps<typeof PolarGrid>["gridType"]
  outerRadius?: number | string
  startAngle?: number
  endAngle?: number
  polarGridProps?: ComponentProps<typeof PolarGrid>
  polarAngleAxisProps?: ComponentProps<typeof PolarAngleAxis>
  polarRadiusAxisProps?: ComponentProps<typeof PolarRadiusAxis>
  radarProps?: Partial<ComponentProps<typeof Radar>>
  chartProps?: Omit<ComponentProps<typeof RadarChartPrimitive>, "data">
}

export function RadarChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  colors = DEFAULT_COLORS,
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  legend = true,
  legendProps,

  hidePolarGrid = false,
  showRadiusAxis = false,
  fillOpacity = 0.2,
  gridType = "polygon",
  outerRadius = "72%",
  startAngle,
  endAngle,

  valueFormatter = (value: number) => value.toString(),

  polarGridProps,
  polarAngleAxisProps,
  polarRadiusAxisProps,
  radarProps,
  chartProps,
  overlays,
  ...props
}: RadarChartProps<TValue, TName>) {
  const configKeys = useMemo(() => Object.keys(config), [config])
  const categoryColors = useMemo(
    () => constructCategoryColors(configKeys, colors),
    [configKeys, colors],
  )
  const configEntries = useMemo(() => Object.entries(config), [config])

  return (
    <Chart config={config} data={data} dataKey={dataKey} layout="radial" {...props}>
      {({ onLegendSelect, selectedLegend }) => (
        <RadarChartPrimitive
          onClick={() => {
            onLegendSelect(null)
          }}
          data={data}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          margin={{
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
          }}
          {...chartProps}
        >
          {!hidePolarGrid && (
            <PolarGrid
              gridType={gridType}
              className="stroke-quebi-line/10"
              {...polarGridProps}
            />
          )}
          <PolarAngleAxis
            dataKey={dataKey}
            className="text-xs **:[text]:fill-quebi-fg-muted"
            tickLine={false}
            {...polarAngleAxisProps}
          />
          <PolarRadiusAxis
            className="text-xs **:[text]:fill-quebi-fg-muted"
            tick={showRadiusAxis}
            axisLine={false}
            tickFormatter={valueFormatter}
            {...polarRadiusAxisProps}
          />

          {legend && (
            <ChartLegend
              content={typeof legend === "boolean" ? <ChartLegendContent /> : legend}
              {...legendProps}
            />
          )}

          {tooltip && (
            <ChartTooltip
              content={
                typeof tooltip === "boolean" ? <ChartTooltipContent accessibilityLayer /> : tooltip
              }
              {...tooltipProps}
            />
          )}

          {!children
            ? configEntries.map(([category, values]) => {
                const color = getColorValue(values.color || categoryColors.get(category))
                const dimmed = selectedLegend !== null && selectedLegend !== category

                return (
                  <Radar
                    key={category}
                    name={category}
                    dataKey={category}
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={dimmed ? 0.1 : 1}
                    fill={color}
                    fillOpacity={dimmed ? 0.02 : fillOpacity}
                    dot={false}
                    isAnimationActive
                    {...radarProps}
                  />
                )
              })
            : children}

          {overlays}
        </RadarChartPrimitive>
      )}
    </Chart>
  )
}
