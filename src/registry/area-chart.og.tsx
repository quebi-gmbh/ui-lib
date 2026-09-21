import { AreaChart } from "@/components/area-chart"
import type { ChartConfig } from "@/components/chart"
import { NO_ANIMATION, SIX_MONTHS, TWO_SERIES } from "./og-chart-data"
import type { OgScene } from "./types"

const config: ChartConfig = TWO_SERIES

/** Six months, two series, gradient fills. */
export const areaChartOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <AreaChart
        config={config}
        data={SIX_MONTHS}
        dataKey="month"
        containerHeight={220}
        areaProps={NO_ANIMATION}
      />
    </div>
  ),
}
