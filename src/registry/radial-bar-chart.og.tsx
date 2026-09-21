import type { ChartConfig } from "@/components/chart"
import { RadialBarChart } from "@/components/radial-bar-chart"
import { NO_ANIMATION } from "./og-chart-data"
import type { OgScene } from "./types"

const browsers = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 },
  { browser: "Edge", visitors: 173 },
]

const config: ChartConfig = {
  visitors: { label: "Visitors" },
  Chrome: { label: "Chrome", color: "chart-1" },
  Safari: { label: "Safari", color: "chart-2" },
  Firefox: { label: "Firefox", color: "chart-3" },
  Edge: { label: "Edge", color: "chart-4" },
}

/** One ring per row, coloured by the row rather than by the series. */
export const radialBarChartOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <RadialBarChart
        config={config}
        data={browsers}
        dataKey="browser"
        colorByCategory
        containerHeight={240}
        radialBarProps={NO_ANIMATION}
      />
    </div>
  ),
}
