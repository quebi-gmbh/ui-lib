import type { ChartConfig } from "@/components/chart"
import { PieChart } from "@/components/pie-chart"
import { NO_ANIMATION } from "./og-chart-data"
import type { OgScene } from "./types"

const data = [
  { name: "Teal", value: 275 },
  { name: "Violet", value: 200 },
  { name: "Sky", value: 187 },
  { name: "Amber", value: 173 },
  { name: "Pink", value: 90 },
]

const config: ChartConfig = {
  Teal: { label: "Teal", color: "chart-1" },
  Violet: { label: "Violet", color: "chart-2" },
  Sky: { label: "Sky", color: "chart-3" },
  Amber: { label: "Amber", color: "chart-4" },
  Pink: { label: "Pink", color: "chart-5" },
}

/** Five segments, the whole palette ring in one glyph. */
export const pieChartOgScene: OgScene = {
  scale: 1.2,
  render: () => (
    <div className="w-144">
      <PieChart
        config={config}
        data={data}
        dataKey="value"
        nameKey="name"
        containerHeight={260}
        pieProps={NO_ANIMATION}
      />
    </div>
  ),
}
