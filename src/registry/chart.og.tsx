import { Line, LineChart } from "recharts"
import {
  CartesianGrid,
  Chart,
  ChartLegend,
  ChartLegendContent,
  XAxis,
  YAxis,
} from "@/components/chart"
import { SIX_MONTHS, TWO_SERIES } from "./og-chart-data"
import type { OgScene } from "./types"

/**
 * The wrapper with a raw recharts chart inside it, which is what this entry is
 * for: the themed axes, grid and legend are quebi's, the mark is recharts'.
 * `isAnimationActive` is set here on the series itself rather than through an
 * escape hatch, because here there is nothing in between.
 */
export const chartOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <Chart config={TWO_SERIES} data={SIX_MONTHS} dataKey="month" containerHeight={220}>
        <LineChart data={SIX_MONTHS} accessibilityLayer>
          <CartesianGrid />
          <XAxis />
          <YAxis />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="desktop"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="mobile"
            stroke="var(--color-mobile)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </Chart>
    </div>
  ),
}
