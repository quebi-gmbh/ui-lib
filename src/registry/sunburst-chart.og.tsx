import type { ChartConfig } from "@/components/chart"
import { SunburstChart, type SunburstDatum } from "@/components/sunburst-chart"
import type { OgScene } from "./types"

const traffic: SunburstDatum = {
  name: "All traffic",
  value: 1000,
  children: [
    {
      name: "Direct",
      value: 400,
      children: [
        { name: "Bookmarks", value: 240 },
        { name: "Typed", value: 160 },
      ],
    },
    {
      name: "Search",
      value: 360,
      children: [
        { name: "Organic", value: 250 },
        { name: "Paid", value: 110 },
      ],
    },
    {
      name: "Social",
      value: 240,
      children: [
        { name: "Mastodon", value: 140 },
        { name: "LinkedIn", value: 100 },
      ],
    },
  ],
}

const config: ChartConfig = {}

/** Two rings: top-level branches inside, their children outside in the same hue. */
export const sunburstChartOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <SunburstChart config={config} data={traffic} containerHeight={240} />
    </div>
  ),
}
