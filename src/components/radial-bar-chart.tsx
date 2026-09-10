"use client"

import { type ComponentProps, useMemo } from "react"
import {
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart as RadialBarChartPrimitive,
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
 * RadialBarChart — quebi design system
 *
 * Bars drawn around a circle, on the quebi `Chart` wrapper. One ring per row of
 * `data` and one series per key in `config`; `type="stacked"` puts the series on
 * a single ring. Set `angleDomain` to turn it into a gauge — the sweep then
 * measures the value against a fixed scale rather than against the other rows —
 * and `showLabel` to print the value in the middle.
 *
 * Unlike every other chart here, recharts builds a radial bar chart's legend
 * from the *rows*, not from the series — each ring is a category, so that is
 * what a reader needs named. It pairs with `colorByCategory`, which is what
 * gives those legend swatches a colour of their own; with several series and no
 * `colorByCategory` the rings have no single colour and the legend is better
 * turned off, leaving the tooltip to name the series.
 *
 * Requires the `recharts` npm package as a peer dependency.
 */

function sumNumericArray(arr: number[]): number {
  return arr.reduce((sum, num) => sum + num, 0)
}

export interface RadialBarChartProps<TValue extends ValueType, TName extends NameType>
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
  /**
   * Fix the angular scale to this `[min, max]` instead of deriving it from the
   * data. This is what makes a single row read as a gauge: 72 out of 100 sweeps
   * 72% of the arc, rather than filling it because it is the only value there.
   */
  angleDomain?: [number, number]
  /** Color each *row* from the palette instead of each series. */
  colorByCategory?: boolean
  /** Draw the unfilled remainder of every ring. */
  showBackground?: boolean
  /** Print a value in the middle of the chart. */
  showLabel?: boolean
  /** Text for the centered label. Defaults to the total of the first series. */
  label?: string
  /** Second line under the centered label. */
  labelDescription?: string
  innerRadius?: number | string
  outerRadius?: number | string
  startAngle?: number
  endAngle?: number
  barSize?: number
  cornerRadius?: number
  radialBarProps?: Partial<ComponentProps<typeof RadialBar>>
  chartProps?: Omit<ComponentProps<typeof RadialBarChartPrimitive>, "data">
}

export function RadialBarChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  colors = DEFAULT_COLORS,
  type = "default",
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  legend = true,
  legendProps,

  angleDomain,
  colorByCategory = false,
  showBackground = true,
  showLabel = false,
  label,
  labelDescription,

  innerRadius = "30%",
  outerRadius = "95%",
  startAngle = 90,
  endAngle = -270,
  barSize,
  cornerRadius = 4,

  valueFormatter = (value: number) => value.toString(),

  radialBarProps,
  chartProps,
  overlays,
  ...props
}: RadialBarChartProps<TValue, TName>) {
  // With `colorByCategory` the config doubles as a category-to-colour map, the
  // way PieChart's does — so an entry named after a *row* is not a series. Only
  // the keys the rows actually carry a value for become bars; with no rows yet
  // there is nothing to check against, so every entry stands.
  const configEntries = useMemo(() => {
    const entries = Object.entries(config)
    if (data.length === 0) {
      return entries
    }
    const seriesEntries = entries.filter(([key]) => data.some((row) => key in row))
    return seriesEntries.length > 0 ? seriesEntries : entries
  }, [config, data])

  const seriesKeys = useMemo(() => configEntries.map(([key]) => key), [configEntries])
  const categoryColors = useMemo(
    () => constructCategoryColors(seriesKeys, colors),
    [seriesKeys, colors],
  )

  const stacked = type === "stacked" || type === "percent"

  // Recharts builds *this* chart's legend from the rows rather than from the
  // series, and it reads each row's `name` — so rows named by any other key all
  // collapse onto one legend entry, and React sees a repeated key. Normalizing
  // the field is what makes one legend item per ring. `fill` is the same story:
  // the legend swatch is the row's own colour, which only exists once the rows
  // are coloured rather than the series.
  const rows = useMemo<Record<string, unknown>[]>(
    () =>
      data.map((row, index) => ({
        ...row,
        name: row.name ?? row[dataKey],
        ...(colorByCategory
          ? {
              fill: getColorValue(
                config[row[dataKey] as string]?.color ?? colors[index % colors.length],
              ),
            }
          : {}),
      })),
    [data, dataKey, colorByCategory, config, colors],
  )

  // The centered label defaults to the total of the first series, which for the
  // one-row gauge is simply that row's value.
  const centerLabel = useMemo(() => {
    const [firstKey] = seriesKeys
    if (label || !firstKey) {
      return label ?? ""
    }
    return valueFormatter(sumNumericArray(rows.map((row) => Number(row[firstKey]) || 0)))
  }, [label, seriesKeys, rows, valueFormatter])

  return (
    <Chart config={config} data={rows} dataKey={dataKey} layout="radial" {...props}>
      {({ onLegendSelect, selectedLegend }) => (
        <RadialBarChartPrimitive
          onClick={() => {
            onLegendSelect(null)
          }}
          data={rows}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          barSize={barSize}
          margin={{
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
          }}
          {...chartProps}
        >
          {angleDomain && (
            <PolarAngleAxis type="number" domain={angleDomain} tick={false} axisLine={false} />
          )}

          {showLabel && (
            <text
              className="fill-quebi-fg font-semibold"
              data-slot="label"
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <tspan className="text-2xl">{centerLabel}</tspan>
              {labelDescription && (
                <tspan
                  className="fill-quebi-fg-muted text-xs"
                  x="50%"
                  dy="1.6em"
                  fontWeight="normal"
                >
                  {labelDescription}
                </tspan>
              )}
            </text>
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
            ? configEntries.map(([category, values]) => {
                const color = getColorValue(values.color || categoryColors.get(category))
                // The legend names rings, not series, so a selection is a row
                // name here — dimming every series because none of them matched
                // it would blank the chart on the first click.
                const dimmed =
                  selectedLegend !== null &&
                  seriesKeys.includes(selectedLegend) &&
                  selectedLegend !== category

                return (
                  <RadialBar
                    key={category}
                    name={category}
                    dataKey={category}
                    stackId={stacked ? "stack" : undefined}
                    background={showBackground}
                    cornerRadius={cornerRadius}
                    fill={color}
                    fillOpacity={dimmed ? 0.1 : 1}
                    isAnimationActive
                    {...radialBarProps}
                  >
                    {colorByCategory &&
                      rows.map((row, index) => {
                        const rowName = String(row.name ?? index)
                        const rowDimmed =
                          selectedLegend !== null &&
                          !seriesKeys.includes(selectedLegend) &&
                          selectedLegend !== rowName

                        return (
                          <Cell
                            key={`${category}-${rowName}`}
                            fill={String(row.fill)}
                            fillOpacity={rowDimmed ? 0.15 : 1}
                          />
                        )
                      })}
                  </RadialBar>
                )
              })
            : children}

          {overlays}
        </RadialBarChartPrimitive>
      )}
    </Chart>
  )
}
