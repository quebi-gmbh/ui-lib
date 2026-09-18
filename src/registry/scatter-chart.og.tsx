import type { ChartConfig } from "@/components/chart"
import { ScatterChart } from "@/components/scatter-chart"
import { NO_ANIMATION } from "./og-chart-data"
import type { OgScene } from "./types"

const measurements = [
  { height: 161, weight: 55 },
  { height: 167, weight: 62 },
  { height: 170, weight: 68 },
  { height: 175, weight: 71 },
  { height: 179, weight: 78 },
  { height: 183, weight: 82 },
  { height: 188, weight: 91 },
  { height: 193, weight: 99 },
]

const config: ChartConfig = {
  morning: { label: "Morning cohort", color: "chart-1" },
}

/** One cloud of points: x from `dataKey`, y from `yKey`. */
export const scatterChartOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <div className="w-144">
      <ScatterChart
        config={config}
        data={measurements}
        dataKey="height"
        yKey="weight"
        containerHeight={220}
        scatterProps={NO_ANIMATION}
      />
    </div>
  ),
}
