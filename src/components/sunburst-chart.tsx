"use client"

import { type ComponentProps, useMemo } from "react"
import { SunburstChart as SunburstChartPrimitive, type SunburstData } from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import {
  type BaseChartProps,
  type ChartColorKeys,
  Chart,
  ChartTooltip,
  ChartTooltipContent,
  EXTENDED_COLORS,
  getColorValue,
} from "@/components/chart"

/**
 * SunburstChart — quebi design system
 *
 * The same hierarchy a `Treemap` shows as nested rectangles, drawn as concentric
 * rings: the inner ring is the top-level branches and every ring outwards is one
 * level deeper. Each branch takes one hue from the quebi palette and its
 * descendants inherit it, so a ring segment's color says which branch it belongs
 * to. Override a branch's color with a `config` entry under its name.
 *
 * Recharts renders the *value* inside each segment, not the name — the name is
 * on the tooltip. Pass `hideValues` for a chart that carries no numbers at all.
 *
 * Requires the `recharts` npm package as a peer dependency.
 */

/**
 * Recharts wants one root node, not an array, and reads the root's own value as
 * the full sweep of the circle. Give the root the total.
 */
export type SunburstDatum = SunburstData

/**
 * Paint each top-level branch with one palette hue and hand it down. Recharts
 * resolves a segment's fill from the node itself before falling back to its
 * parent's, so writing it on every node keeps the rings of one branch together.
 */
function paintBranches(
  nodes: readonly SunburstData[],
  colors: readonly (ChartColorKeys | (string & {}))[],
  overrides: Record<string, string | undefined>,
  inherited?: string,
): SunburstData[] {
  return nodes.map((node, index) => {
    const fill =
      inherited ??
      getColorValue(overrides[node.name] ?? colors[index % colors.length] ?? colors[0])

    return {
      ...node,
      fill,
      children: node.children
        ? paintBranches(node.children, colors, overrides, fill)
        : undefined,
    }
  })
}

// The recharts default is bold black text with a white halo, which is legible on
// exactly one theme. Both of these are theme tokens, so the label follows the
// surface it is drawn on.
const quebiTextOptions = {
  fill: "var(--color-quebi-fg)",
  stroke: "var(--color-quebi-bg)",
  strokeWidth: 3,
  paintOrder: "stroke fill",
  fontSize: "0.75rem",
  fontWeight: "500",
  pointerEvents: "none",
} as const

const hiddenTextOptions = { ...quebiTextOptions, fill: "transparent", stroke: "transparent" }

export interface SunburstChartProps<TValue extends ValueType, TName extends NameType>
  extends Omit<
    BaseChartProps<TValue, TName>,
    | "data"
    | "dataKey"
    | "layout"
    | "type"
    | "legend"
    | "legendProps"
    | "hideGridLines"
    | "hideXAxis"
    | "hideYAxis"
    | "xAxisProps"
    | "yAxisProps"
    | "cartesianGridProps"
    | "displayEdgeLabelsOnly"
    | "intervalType"
    | "valueFormatter"
  > {
  /** The root of the tree. Its `children` become the innermost ring. */
  data: SunburstDatum
  /** Key of the value on every node. Defaults to `"value"`. */
  dataKey?: string
  /** Key of the node's name, used by the tooltip. Defaults to `"name"`. */
  nameKey?: string
  /** Radius of the hole in the middle, in px. */
  innerRadius?: number
  outerRadius?: number
  /** Gap between rings, in px. */
  ringPadding?: number
  /** Gap between neighbouring segments, in px. */
  padding?: number
  startAngle?: number
  endAngle?: number
  /** Draw the rings without the value printed inside each segment. */
  hideValues?: boolean
  chartProps?: Omit<ComponentProps<typeof SunburstChartPrimitive>, "data">
}

export function SunburstChart<TValue extends ValueType, TName extends NameType>({
  data,
  dataKey = "value",
  nameKey = "name",
  colors = EXTENDED_COLORS,
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  innerRadius = 40,
  outerRadius,
  ringPadding = 2,
  padding = 2,
  startAngle = 0,
  endAngle = 360,
  hideValues = false,

  chartProps,
  ...props
}: SunburstChartProps<TValue, TName>) {
  const overrides = useMemo(() => {
    const entries: Record<string, string | undefined> = {}
    for (const [key, value] of Object.entries(config)) {
      entries[key] = value.color
    }
    return entries
  }, [config])

  const painted = useMemo<SunburstData>(
    () => ({
      ...data,
      children: data.children ? paintBranches(data.children, colors, overrides) : undefined,
    }),
    [data, colors, overrides],
  )

  // The Chart context wants a row list; the rings are the top-level branches.
  const contextData = useMemo(
    () => (painted.children ?? []).map((node) => ({ ...node })),
    [painted],
  )

  return (
    <Chart config={config} data={contextData} dataKey={nameKey} layout="radial" {...props}>
      <SunburstChartPrimitive
        data={painted}
        dataKey={dataKey}
        nameKey={nameKey}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        ringPadding={ringPadding}
        padding={padding}
        startAngle={startAngle}
        endAngle={endAngle}
        // A sector's outline is the chart surface showing through, so the rings
        // stay separated in both themes without a hairline of a third color.
        stroke="var(--color-quebi-bg)"
        fill={getColorValue(colors[0])}
        textOptions={hideValues ? hiddenTextOptions : quebiTextOptions}
        {...chartProps}
      >
        {tooltip && (
          <ChartTooltip
            content={
              typeof tooltip === "boolean" ? (
                <ChartTooltipContent hideLabel labelSeparator={false} nameKey={nameKey} />
              ) : (
                tooltip
              )
            }
            {...tooltipProps}
          />
        )}
        {children}
      </SunburstChartPrimitive>
    </Chart>
  )
}
