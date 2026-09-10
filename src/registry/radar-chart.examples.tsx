import type { ChartConfig } from "@/components/chart"
import { RadarChart } from "@/components/radar-chart"
import type { ComponentExample } from "./types"

// NOTE: these examples require the `recharts` npm package to be installed.

const data = [
  { skill: "Speed", current: 120, target: 150, peers: 98 },
  { skill: "Reliability", current: 138, target: 150, peers: 130 },
  { skill: "Coverage", current: 86, target: 130, peers: 110 },
  { skill: "Docs", current: 99, target: 120, peers: 74 },
  { skill: "Support", current: 85, target: 110, peers: 92 },
  { skill: "Cost", current: 65, target: 100, peers: 120 },
]

const singleConfig: ChartConfig = {
  current: { label: "This release", color: "chart-1" },
}

const config: ChartConfig = {
  current: { label: "This release", color: "chart-1" },
  target: { label: "Target", color: "chart-2" },
}

const threeConfig: ChartConfig = {
  current: { label: "This release", color: "chart-1" },
  target: { label: "Target", color: "chart-2" },
  peers: { label: "Peer median", color: "chart-4" },
}

export const radarChartExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "One polygon per config key, over the axes named by `dataKey`.",
    render: () => (
      <RadarChart config={singleConfig} data={data} dataKey="skill" containerHeight={300} />
    ),
  },
  {
    title: "Overlaid series",
    description:
      "Two polygons on the same web. Click a legend item to focus one of them — the other fades rather than disappearing, so the shape stays comparable.",
    render: () => <RadarChart config={config} data={data} dataKey="skill" containerHeight={300} />,
  },
  {
    title: "Outlines only",
    description:
      "`fillOpacity={0}` drops the fills, which keeps three overlapping series readable where stacked translucency would not.",
    render: () => (
      <RadarChart
        config={threeConfig}
        data={data}
        dataKey="skill"
        fillOpacity={0}
        containerHeight={300}
      />
    ),
  },
  {
    title: "Circular grid with a radius axis",
    description:
      "A circular web instead of a polygonal one, with the numeric radius axis shown.",
    render: () => (
      <RadarChart
        config={config}
        data={data}
        dataKey="skill"
        gridType="circle"
        showRadiusAxis
        containerHeight={300}
      />
    ),
  },
  {
    title: "Half radar",
    description: "A start and end angle turn the web into a fan.",
    render: () => (
      <RadarChart
        config={singleConfig}
        data={data}
        dataKey="skill"
        startAngle={180}
        endAngle={0}
        outerRadius="90%"
        containerHeight={260}
      />
    ),
  },
]
