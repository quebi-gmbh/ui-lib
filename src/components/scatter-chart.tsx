"use client"

import { type ComponentProps, useMemo } from "react"
import { ErrorBar, Scatter, ScatterChart as ScatterChartPrimitive, ZAxis } from "recharts"
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
  XAxis,
  YAxis,
} from "@/components/chart"

/**
 * ScatterChart — quebi design system
 *
 * An X/Y scatter plot on the quebi `Chart` wrapper. A single cloud of points
 * comes from `data`; two or more named clouds come from `series`, each keyed
 * into `config` for its label and color. `zKey` sizes the points into a bubble
 * chart, and `errorBarProps` draws error bars from a key on every point.
 *
 * Requires the `recharts` npm package as a peer dependency.
 */

export interface ScatterSeries {
  /** Key into `config` — supplies the label and the color. */
  name: string
  /** This series' own points. Scatter series do not share rows. */
  data: Record<string, unknown>[]
}

// Both axes are numeric here, so the category-axis nudge the shared XAxis
// applies (it centers a label under a band) would push every tick off its tick
// mark. A numeric tick belongs under the value it labels.
const numericXAxisTick = { transform: "translate(0, 6)" } as const

export interface ScatterChartProps<TValue extends ValueType, TName extends NameType>
  extends Omit<BaseChartProps<TValue, TName>, "data" | "type" | "layout" | "displayEdgeLabelsOnly"> {
  /** Points of the single, unnamed series. Ignored when `series` is given. */
  data?: Record<string, unknown>[]
  /** Two or more named series, each carrying its own points. */
  series?: ScatterSeries[]
  /** Key of the X value on every point. */
  dataKey: string
  /** Key of the Y value on every point. */
  yKey: string
  /** Key of the Z value — supplying it sizes the points into bubbles. */
  zKey?: string
  /** Point area range, in px², that `zKey` is mapped onto. */
  zRange?: [number, number]
  /** Radius of a plain (non-bubble) point. */
  pointSize?: number
  shape?: ComponentProps<typeof Scatter>["shape"]
  /** Rendered inside every series when given — `dataKey` names the error value. */
  errorBarProps?: ComponentProps<typeof ErrorBar>
  chartProps?: Omit<ComponentProps<typeof ScatterChartPrimitive>, "data">
  scatterProps?: Partial<ComponentProps<typeof Scatter>>
}

export function ScatterChart<TValue extends ValueType, TName extends NameType>({
  data,
  series,
  dataKey,
  yKey,
  zKey,
  zRange = [60, 400],
  pointSize = 90,
  shape = "circle",
  colors = DEFAULT_COLORS,
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  legend = true,
  legendProps,

  cartesianGridProps,

  intervalType = "preserveStartEnd",

  valueFormatter = (value: number) => value.toString(),

  // XAxis
  xAxisProps,
  hideXAxis = false,

  // YAxis
  yAxisProps,
  hideYAxis = false,

  hideGridLines = false,
  chartProps,
  scatterProps,
  errorBarProps,
  overlays,
  ...props
}: ScatterChartProps<TValue, TName>) {
  const configKeys = useMemo(() => Object.keys(config), [config])

  const resolvedSeries = useMemo<ScatterSeries[]>(
    () => series ?? [{ name: configKeys[0] ?? yKey, data: data ?? [] }],
    [series, configKeys, yKey, data],
  )

  const categoryColors = useMemo(
    () => constructCategoryColors(resolvedSeries.map((s) => s.name), colors),
    [resolvedSeries, colors],
  )

  // The Chart context uses `data` for the X axis' edge labels, and each series
  // keeps its own points, so the context gets every point there is.
  const allPoints = useMemo(
    () => resolvedSeries.flatMap((s) => s.data),
    [resolvedSeries],
  )

  return (
    <Chart config={config} data={allPoints} dataKey={dataKey} {...props}>
      {({ onLegendSelect, selectedLegend }) => (
        <ScatterChartPrimitive
          onClick={() => {
            onLegendSelect(null)
          }}
          margin={{
            bottom: 0,
            left: 5,
            right: 10,
            top: 10,
          }}
          {...chartProps}
        >
          {!hideGridLines && <CartesianGrid strokeDasharray="4 4" {...cartesianGridProps} />}
          <XAxis
            type="number"
            name={dataKey}
            hide={hideXAxis}
            tick={numericXAxisTick}
            intervalType={intervalType}
            tickFormatter={valueFormatter}
            {...xAxisProps}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name={yKey}
            hide={hideYAxis}
            tickFormatter={valueFormatter}
            {...yAxisProps}
          />
          {/* The Z axis is what sizes a point, so it is always present: with a
              `zKey` it spreads the values over `zRange`, without one it pins
              every point to the same area. */}
          {zKey ? (
            <ZAxis type="number" dataKey={zKey} name={zKey} range={zRange} />
          ) : (
            <ZAxis type="number" range={[pointSize, pointSize]} />
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
                typeof tooltip === "boolean" ? (
                  <ChartTooltipContent hideLabel labelSeparator={false} accessibilityLayer />
                ) : (
                  tooltip
                )
              }
              {...tooltipProps}
            />
          )}

          {!children
            ? resolvedSeries.map((s) => {
                const color = getColorValue(config[s.name]?.color || categoryColors.get(s.name))
                const dimmed = selectedLegend !== null && selectedLegend !== s.name

                return (
                  <Scatter
                    key={s.name}
                    name={s.name}
                    data={s.data}
                    // Deliberately no `dataKey`: a scatter series is identified
                    // by its name, and every series sharing one data key would
                    // give the legend the same id for all of them.
                    fill={color}
                    fillOpacity={dimmed ? 0.1 : 0.75}
                    stroke={color}
                    strokeOpacity={dimmed ? 0.2 : 1}
                    strokeWidth={1}
                    shape={shape}
                    legendType="circle"
                    {...scatterProps}
                  >
                    {errorBarProps && (
                      <ErrorBar
                        width={4}
                        strokeWidth={1}
                        stroke={color}
                        strokeOpacity={dimmed ? 0.2 : 0.6}
                        direction="y"
                        {...errorBarProps}
                      />
                    )}
                  </Scatter>
                )
              })
            : children}

          {overlays}
        </ScatterChartPrimitive>
      )}
    </Chart>
  )
}
