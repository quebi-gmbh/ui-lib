import type { ChartConfig } from "@/components/chart"
import { LineChart } from "@/components/line-chart"
import { NO_ANIMATION, SIX_MONTHS, TWO_SERIES } from "./og-chart-data"
import type { OgScene } from "./types"

const config: ChartConfig = TWO_SERIES

/** Two lines over six months, with the legend that focuses one of them. */
export const lineChartOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <LineChart
        config={config}
        data={SIX_MONTHS}
        dataKey="month"
        containerHeight={220}
        lineProps={NO_ANIMATION}
      />
    </div>
  ),
}
