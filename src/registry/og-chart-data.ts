import type { ChartConfig } from "@/components/chart"

/**
 * The fixtures the chart OG scenes share.
 *
 * Twelve chart scenes drawing the same two series out of twelve copies of the
 * same array would be twelve places to change a colour, and the scenes are the
 * one set of files nobody reads twice.
 */

/**
 * Recharts animates on mount, and an animation is a different picture every
 * time the shutter opens. Every chart component takes the series element's
 * props through an escape hatch — `areaProps`, `barProps`, `lineProps` and so
 * on — and each of them spreads *after* the component's own `isAnimationActive`,
 * so this is the one value that turns it off. `tests/og-scenes.test.ts` fails a
 * chart scene that forgets it, because a forgotten one is invisible until two
 * builds of the same commit disagree.
 */
export const NO_ANIMATION = { isAnimationActive: false } as const

export const SIX_MONTHS = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 173, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 264, mobile: 140 },
]

export const TWO_SERIES: ChartConfig = {
  desktop: { label: "Desktop", color: "chart-1" },
  mobile: { label: "Mobile", color: "chart-2" },
}
