"use client"

import { type ComponentProps, useMemo } from "react"
import { Treemap as TreemapPrimitive, type TreemapNode } from "recharts"
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
 * Treemap — quebi design system
 *
 * Hierarchical data as nested rectangles, on the quebi `Chart` wrapper. Every
 * top-level branch takes one hue from the quebi palette and its descendants
 * inherit it, so depth reads as nesting and color reads as branch. Leaves are
 * filled and labelled; a branch that contains other nodes is drawn as a frame.
 * Override a branch's color with a `config` entry under its name.
 *
 * Requires the `recharts` npm package as a peer dependency.
 */

/** A node of the source tree: a name, a value, and optionally more nodes. */
export interface TreemapDatum extends Record<string, unknown> {
  children?: TreemapDatum[]
}

/**
 * Paint each top-level branch with one palette hue and hand that hue down to
 * every descendant. Recharts keeps unknown fields on a node as it computes the
 * layout, so a `fill` written here is what the content renderer reads back.
 */
function paintBranches(
  nodes: readonly TreemapDatum[],
  colors: readonly (ChartColorKeys | (string & {}))[],
  nameKey: string,
  overrides: Record<string, string | undefined>,
  inherited?: string,
): TreemapDatum[] {
  return nodes.map((node, index) => {
    const name = String(node[nameKey] ?? "")
    const fill =
      inherited ?? getColorValue(overrides[name] ?? colors[index % colors.length] ?? colors[0])

    return {
      ...node,
      fill,
      children: node.children
        ? paintBranches(node.children, colors, nameKey, overrides, fill)
        : undefined,
    }
  })
}

const readFill = (node: TreemapNode): string | undefined =>
  typeof node.fill === "string" ? node.fill : undefined

export interface TreemapProps<TValue extends ValueType, TName extends NameType>
  extends Omit<
    BaseChartProps<TValue, TName>,
    | "content"
    | "data"
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
  > {
  /** The tree. A node with `children` is a branch; one without is a leaf. */
  data: TreemapDatum[]
  /** Key of the leaf value on every node. */
  dataKey: string
  /** Key of the node's name. Defaults to `"name"`. */
  nameKey?: string
  aspectRatio?: number
  /** Gap between sibling rectangles, in px. */
  nodeGap?: number
  /** Inset between a branch and the nodes inside it, in px. */
  nodeInset?: number
  /** Show each leaf's value under its name, formatted with `valueFormatter`. */
  showValues?: boolean
  content?: ComponentProps<typeof TreemapPrimitive>["content"]
  chartProps?: Omit<ComponentProps<typeof TreemapPrimitive>, "data" | "content">
}

export function Treemap<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  nameKey = "name",
  colors = EXTENDED_COLORS,
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  aspectRatio = 4 / 3,
  nodeGap = 2,
  nodeInset = 0,
  showValues = false,

  valueFormatter = (value: number) => value.toString(),

  content,
  chartProps,
  ...props
}: TreemapProps<TValue, TName>) {
  const overrides = useMemo(() => {
    const entries: Record<string, string | undefined> = {}
    for (const [key, value] of Object.entries(config)) {
      entries[key] = value.color
    }
    return entries
  }, [config])

  const painted = useMemo(
    () => paintBranches(data, colors, nameKey, overrides),
    [data, colors, nameKey, overrides],
  )

  const renderNode = useMemo(
    () => (node: TreemapNode) => {
      const { x, y, width, height, depth, name, children: nodeChildren, value } = node
      const color = readFill(node) ?? getColorValue(colors[0])
      const isBranch = Boolean(nodeChildren?.length)

      // Recharts lays out the root of the tree as a node of its own, filling
      // the whole chart. Drawing it would put a frame around everything and a
      // wash of the first palette hue behind every branch.
      if (depth === 0) {
        return <g />
      }

      // Recharts lays every node out, including ones squeezed to nothing.
      if (!(width > 0) || !(height > 0)) {
        return <g />
      }

      const fitsName = width > 46 && height > 22
      const fitsValue = showValues && !isBranch && width > 46 && height > 40

      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={isBranch ? 6 : 4}
            fill={color}
            fillOpacity={isBranch ? 0 : 0.5}
            // A leaf is separated from its neighbours by the chart surface
            // showing through; a branch is outlined in its own hue. Both are
            // set as attributes rather than as a class, because a stroke class
            // would win over the attribute and paint every frame the same.
            stroke={isBranch ? color : "var(--color-quebi-bg)"}
            strokeOpacity={isBranch ? 0.45 : 1}
            strokeWidth={isBranch ? 1.5 : 2}
          />
          {fitsName && (
            <text
              x={x + 8}
              y={y + (isBranch ? 16 : fitsValue ? height / 2 - 2 : height / 2 + 4)}
              className={
                isBranch
                  ? "fill-quebi-fg-muted text-xs uppercase tracking-wide"
                  : "fill-quebi-fg font-medium text-xs"
              }
            >
              {name}
            </text>
          )}
          {fitsValue && (
            <text
              x={x + 8}
              y={y + height / 2 + 14}
              className="fill-quebi-fg-muted font-mono text-xs tabular-nums"
            >
              {valueFormatter(Number(value) || 0)}
            </text>
          )}
        </g>
      )
    },
    [colors, showValues, valueFormatter],
  )

  return (
    <Chart config={config} data={painted} dataKey={dataKey} {...props}>
      <TreemapPrimitive
        data={painted}
        dataKey={dataKey}
        nameKey={nameKey}
        aspectRatio={aspectRatio}
        nodeGap={nodeGap}
        nodeInset={nodeInset}
        isAnimationActive={false}
        content={content ?? renderNode}
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
      </TreemapPrimitive>
    </Chart>
  )
}
