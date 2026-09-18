import type { ChartConfig } from "@/components/chart"
import { ComposedChart, type ComposedSeries } from "@/components/composed-chart"
import { NO_ANIMATION } from "./og-chart-data"
import type { OgScene } from "./types"

/** The two series share a magnitude on purpose: one axis, two marks, and a line
 * an order of magnitude under the bars would be a flat line on the floor. */
const data = [
  { month: "Jan", orders: 186, forecast: 210 },
  { month: "Feb", orders: 305, forecast: 240 },
  { month: "Mar", orders: 237, forecast: 250 },
  { month: "Apr", orders: 173, forecast: 255 },
  { month: "May", orders: 209, forecast: 260 },
  { month: "Jun", orders: 264, forecast: 270 },
]

const config: ChartConfig = {
  orders: { label: "Orders", color: "chart-1" },
  forecast: { label: "Forecast", color: "chart-4" },
}

const series: ComposedSeries[] = [
  { key: "orders", type: "bar" },
  { key: "forecast", type: "line" },
]

/** Bars and a line on one axis — two marks is the whole point of this one. */
export const composedChartOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <div className="w-144">
      <ComposedChart
        config={config}
        data={data}
        dataKey="month"
        series={series}
        containerHeight={220}
        barProps={NO_ANIMATION}
        lineProps={NO_ANIMATION}
      />
    </div>
  ),
}
