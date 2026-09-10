"use client"

import { type ComponentProps, useMemo } from "react"
import { Area, Bar, ComposedChart as ComposedChartPrimitive, Line } from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import {
  type BaseChartProps,
  CartesianGrid,
  Chart,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  constructCategoryColors,
  DEFAULT_COLORS,
  getColorValue,
  valueToPercent,
  XAxis,
  YAxis,
} from "@/components/chart"

/**
 * ComposedChart — quebi design system
 *
 * Bars, lines and areas on one pair of axes, built on the quebi `Chart` wrapper.
 * Each entry in `series` names a key in `config` and the mark it is drawn with;
 * colors come from the teal-led quebi palette and can be overridden per key via
 * `config`. A series can be measured against a second, right-hand Y axis by
 * setting `yAxisId: "right"` — the axis appears only when something uses it.
 *
 * Requires the `recharts` npm package as a peer dependency.
 */

/** The mark a composed series is drawn with. */
export type ComposedSeriesType = "area" | "bar" | "line"

export interface ComposedSeries {
  /** Key in both `data` and `config` — the config entry supplies label and color. */
  key: string
  /** The mark this series is drawn with. */
  type: ComposedSeriesType
  /** Which Y axis the series is measured against. Defaults to `"left"`. */
  yAxisId?: "left" | "right"
  /** Series sharing a `stackId` on the same axis are stacked together. */
  stackId?: string
}

// Areas sit behind bars, bars behind lines, whatever order `series` arrives in.
// A line hidden under a bar is never what the author meant, and the alternative
// is asking every caller to remember the z-order of their own marks.
const MARK_ORDER: Record<ComposedSeriesType, number> = { area: 0, bar: 1, line: 2 }

export interface ComposedChartProps<TValue extends ValueType, TName extends NameType>
  extends BaseChartProps<TValue, TName> {
  /** One entry per rendered series, in any order. */
  series: ComposedSeries[]
  barRadius?: number
  barSize?: number
  barGap?: number
  barCategoryGap?: number
  /** Corner rounding and fill opacity of the `area` marks. */
  areaFillOpacity?: number
  /** Props for the second Y axis. It is rendered only if a series asks for it. */
  rightYAxisProps?: ComponentProps<typeof YAxis>
  /** Tick formatter for the right-hand axis. Falls back to `valueFormatter`. */
  rightValueFormatter?: (value: number) => string
  chartProps?: Omit<ComponentProps<typeof ComposedChartPrimitive>, "data" | "stackOffset">
  areaProps?: Partial<ComponentProps<typeof Area>>
  barProps?: Partial<ComponentProps<typeof Bar>>
  lineProps?: Partial<ComponentProps<typeof Line>>
}

export function ComposedChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  series,
  colors = DEFAULT_COLORS,
  type = "default",
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  legend = true,
  legendProps,

  cartesianGridProps,

  intervalType = "equidistantPreserveStart",

  barCategoryGap = 5,
  barGap,
  barSize,
  barRadius = 4,
  areaFillOpacity = 0.2,

  valueFormatter = (value: number) => value.toString(),
  rightValueFormatter,

  // XAxis
  displayEdgeLabelsOnly = false,
  xAxisProps,
  hideXAxis = false,

  // YAxis
  yAxisProps,
  rightYAxisProps,
  hideYAxis = false,

  hideGridLines = false,
  chartProps,
  areaProps,
  barProps,
  lineProps,
  overlays,
  ...props
}: ComposedChartProps<TValue, TName>) {
  const configKeys = useMemo(() => Object.keys(config), [config])
  const categoryColors = useMemo(
    () => constructCategoryColors(configKeys, colors),
    [configKeys, colors],
  )

  const orderedSeries = useMemo(
    () => [...series].sort((a, b) => MARK_ORDER[a.type] - MARK_ORDER[b.type]),
    [series],
  )

  const hasRightAxis = useMemo(() => series.some((s) => s.yAxisId === "right"), [series])
  const stacked = type === "stacked" || type === "percent"

  return (
    <Chart config={config} data={data} dataKey={dataKey} {...props}>
      {({ onLegendSelect, selectedLegend }) => (
        <ComposedChartPrimitive
          onClick={() => {
            onLegendSelect(null)
          }}
          data={data}
          margin={{
            bottom: 0,
            left: 5,
            right: 0,
            top: 5,
          }}
          barGap={barGap}
          barSize={barSize}
          barCategoryGap={barCategoryGap}
          stackOffset={type === "percent" ? "expand" : undefined}
          {...chartProps}
        >
          {!hideGridLines && <CartesianGrid strokeDasharray="4 4" {...cartesianGridProps} />}
          <XAxis
            hide={hideXAxis}
            displayEdgeLabelsOnly={displayEdgeLabelsOnly}
            intervalType={intervalType}
            {...xAxisProps}
          />
          <YAxis
            yAxisId="left"
            hide={hideYAxis}
            tickFormatter={type === "percent" ? valueToPercent : valueFormatter}
            {...yAxisProps}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              hide={hideYAxis}
              tickFormatter={rightValueFormatter ?? valueFormatter}
              {...rightYAxisProps}
            />
          )}

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
            ? orderedSeries.map(({ key, type: markType, yAxisId = "left", stackId }) => {
                const color = getColorValue(config[key]?.color || categoryColors.get(key))
                const dimmed = selectedLegend !== null && selectedLegend !== key
                const strokeOpacity = dimmed ? 0.1 : 1
                const resolvedStackId = stackId ?? (stacked ? "stack" : undefined)

                if (markType === "bar") {
                  return (
                    <Bar
                      key={key}
                      name={key}
                      dataKey={key}
                      yAxisId={yAxisId}
                      stackId={resolvedStackId}
                      radius={resolvedStackId ? undefined : barRadius}
                      fill={color}
                      fillOpacity={dimmed ? 0.1 : 1}
                      stroke={color}
                      strokeWidth={1}
                      strokeOpacity={dimmed ? 0.2 : 0}
                      {...barProps}
                    />
                  )
                }

                if (markType === "area") {
                  return (
                    <Area
                      key={key}
                      name={key}
                      dataKey={key}
                      yAxisId={yAxisId}
                      stackId={resolvedStackId}
                      dot={false}
                      type="monotone"
                      stroke={color}
                      fill={color}
                      fillOpacity={dimmed ? 0.05 : areaFillOpacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ strokeWidth: 2, strokeOpacity }}
                      {...areaProps}
                    />
                  )
                }

                return (
                  <Line
                    key={key}
                    name={key}
                    dataKey={key}
                    yAxisId={yAxisId}
                    dot={false}
                    type="monotone"
                    stroke={color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={
                      {
                        strokeWidth: 2,
                        strokeOpacity,
                        "--line-color": color,
                      } as React.CSSProperties
                    }
                    {...lineProps}
                  />
                )
              })
            : children}

          {overlays}
        </ComposedChartPrimitive>
      )}
    </Chart>
  )
}
