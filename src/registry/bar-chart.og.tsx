import { BarChart } from "@/components/bar-chart"
import type { ChartConfig } from "@/components/chart"
import { NO_ANIMATION, SIX_MONTHS, TWO_SERIES } from "./og-chart-data"
import type { OgScene } from "./types"

const config: ChartConfig = TWO_SERIES

/** Two series side by side, the grouped default. */
export const barChartOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <BarChart
        config={config}
        data={SIX_MONTHS}
        dataKey="month"
        containerHeight={220}
        barProps={NO_ANIMATION}
      />
    </div>
  ),
}
