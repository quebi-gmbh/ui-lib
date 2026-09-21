import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Sparkline — quebi design system
 *
 * An inline, text-sized trend glyph. No axes, no grid, no tooltip, no legend —
 * and no recharts. That last one is the point rather than an economy: a
 * sparkline goes in a table cell, hundreds at a time, and mounting hundreds of
 * chart containers with their own ResizeObservers to draw a 64×16 polyline is
 * how a table stops scrolling. Everything here is one `<svg>` with one shape in
 * it, computed during render.
 *
 * ## Sibling of ActivityPulse by shape, opposite by purpose
 *
 * The two draw the same kind of picture and answer different questions, so the
 * difference is worth stating once. `ActivityPulse` is **self-normalising and
 * unlabelled**, because it reports liveness and is not qualified to report
 * anything else: its scale is its own last five seconds. A Sparkline is
 * **absolute and may carry its last value**, because it reports a trend that
 * the reader is entitled to compare with the one in the row below — which is
 * why `min`/`max` are props, and why passing the same pair to every sparkline
 * in a column is usually what you want.
 *
 * ## Naming it
 *
 * The `<svg>` is always `aria-hidden`: a polyline has no accessible content
 * worth inventing. Give it an `aria-label` and the wrapper becomes a
 * `role="img"`; or pass `children`, which renders beside the glyph as visible
 * text — the last value, a delta, a unit. A sparkline with neither is
 * decoration standing next to a number that is already on the page, which is
 * a legitimate use and the reason neither is required.
 *
 * @example
 * <Sparkline data={weeklySignups} aria-label="Signups, last 12 weeks: rising" />
 * <Sparkline data={latency} variant="bars" min={0}>
 *   <FormattedNumber value={latency.at(-1) ?? 0} />
 * </Sparkline>
 */

export type SparklineVariant = "line" | "area" | "bars"

export interface SparklineProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The series, oldest first. Fewer than two points draws nothing but the box. */
  data: readonly number[]
  variant?: SparklineVariant
  /** Glyph width in px. Defaults to 64 — about four characters. */
  width?: number
  /** Glyph height in px. Defaults to 16, which sits on a line of body text. */
  height?: number
  /** Bottom of the value domain. Defaults to the series minimum. */
  min?: number
  /** Top of the value domain. Defaults to the series maximum. */
  max?: number
  /** Stroke width for `line` and `area`. */
  strokeWidth?: number
  /** Draw a dot on the last point — "you are here". */
  marker?: boolean
  /** Visible text beside the glyph: the last value, a delta, a unit. */
  children?: ReactNode
}

/** The y for a value, in svg coordinates (0 at the top), inset by the stroke. */
function scaleY(value: number, lo: number, hi: number, height: number, inset: number) {
  const span = hi - lo
  const fraction = span === 0 ? 0.5 : (value - lo) / span
  return height - inset - fraction * (height - inset * 2)
}

export function Sparkline({
  data,
  variant = "line",
  width = 64,
  height = 16,
  min,
  max,
  strokeWidth = 1.5,
  marker = false,
  children,
  className,
  role,
  ...props
}: SparklineProps) {
  const inset = strokeWidth / 2
  const lo = min ?? (data.length > 0 ? Math.min(...data) : 0)
  const hi = max ?? (data.length > 0 ? Math.max(...data) : 1)

  // A single point has no step; the guard keeps the divisor away from zero and
  // puts that point where a one-point series belongs — at the right-hand end.
  const step = data.length > 1 ? (width - inset * 2) / (data.length - 1) : 0
  const points = data.map((value, index) => ({
    x: inset + index * step,
    y: scaleY(value, lo, hi, height, inset),
  }))
  const last = points.at(-1)

  const barGap = data.length > 24 ? 0.5 : 1
  const barWidth = data.length > 0 ? Math.max(0.5, (width - barGap * (data.length - 1)) / data.length) : 0

  return (
    <span
      {...props}
      role={role ?? (props["aria-label"] ? "img" : undefined)}
      data-slot="sparkline"
      className={cn("inline-flex items-center gap-1.5 align-middle", className)}
    >
      <svg
        aria-hidden="true"
        data-slot="sparkline-graphic"
        data-variant={variant}
        className="shrink-0 overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {variant === "bars"
          ? data.map((value, index) => {
              const y = scaleY(value, lo, hi, height, 0)
              return (
                <rect
                  // A bar is a fixed position in a fixed series — there is
                  // nothing else to key it by, and the series is redrawn whole.
                  // biome-ignore lint/suspicious/noArrayIndexKey: the bars are positions in the series.
                  key={index}
                  data-slot="sparkline-bar"
                  className="fill-current"
                  x={index * (barWidth + barGap)}
                  y={y}
                  width={barWidth}
                  // Never zero: a value sitting on the floor of the domain is
                  // still a value, and a 0px rect reads as missing data.
                  height={Math.max(1, height - y)}
                  rx={barWidth / 2}
                />
              )
            })
          : null}
        {variant === "area" && points.length > 1 ? (
          <polygon
            data-slot="sparkline-area"
            className="fill-current opacity-15"
            points={`${points[0].x},${height} ${points.map((p) => `${p.x},${p.y}`).join(" ")} ${last?.x ?? 0},${height}`}
          />
        ) : null}
        {variant !== "bars" && points.length > 1 ? (
          <polyline
            data-slot="sparkline-line"
            className="stroke-current"
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          />
        ) : null}
        {marker && last ? (
          <circle
            data-slot="sparkline-marker"
            className="fill-current"
            cx={last.x}
            cy={last.y}
            r={strokeWidth}
          />
        ) : null}
      </svg>
      {children !== undefined && children !== null ? (
        <span data-slot="sparkline-label" className="tabular-nums">
          {children}
        </span>
      ) : null}
    </span>
  )
}
