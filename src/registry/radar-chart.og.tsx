import type { ChartConfig } from "@/components/chart"
import { RadarChart } from "@/components/radar-chart"
import { NO_ANIMATION } from "./og-chart-data"
import type { OgScene } from "./types"

const data = [
  { skill: "Speed", current: 120 },
  { skill: "Reliability", current: 138 },
  { skill: "Coverage", current: 86 },
  { skill: "Docs", current: 99 },
  { skill: "Support", current: 85 },
  { skill: "Cost", current: 65 },
]

const config: ChartConfig = {
  current: { label: "This release", color: "chart-1" },
}

/** One polygon over six axes. */
export const radarChartOgScene: OgScene = {
  scale: 1.45,
  render: () => (
    <div className="w-112">
      <RadarChart
        config={config}
        data={data}
        dataKey="skill"
        containerHeight={260}
        radarProps={NO_ANIMATION}
      />
    </div>
  ),
}
