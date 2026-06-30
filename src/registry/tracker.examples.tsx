import { Tracker, type TrackerBlockProps } from "@/components/tracker"
import type { ComponentExample } from "./types"

const uptime: TrackerBlockProps[] = Array.from({ length: 40 }, (_, i) => {
  if (i === 11 || i === 28)
    return { color: "bg-amber-500", tooltip: "Degraded performance" }
  if (i === 19) return { color: "bg-red-500", tooltip: "Major outage" }
  return { color: "bg-green-500", tooltip: "Operational" }
})

const sparse: TrackerBlockProps[] = Array.from({ length: 30 }, (_, i) => {
  if (i % 7 === 3) return { color: "bg-green-500", tooltip: "Active" }
  if (i % 11 === 0) return { color: "bg-amber-500", tooltip: "Idle" }
  return { tooltip: "No activity" }
})

export const trackerExamples: ComponentExample[] = [
  {
    title: "Uptime",
    description:
      "Forty cells of service health. Green is operational, amber degraded, red an outage. Hover a cell for its status.",
    render: () => (
      <div className="w-full max-w-xl">
        <Tracker data={uptime} />
      </div>
    ),
  },
  {
    title: "Sparse activity",
    description: "Empty cells fall back to the quebi cyan tint; status cells stand out.",
    render: () => (
      <div className="w-full max-w-xl">
        <Tracker data={sparse} />
      </div>
    ),
  },
  {
    title: "Without tooltips",
    description: "Set `disabledTooltip` for a purely visual strip with no interaction.",
    render: () => (
      <div className="w-full max-w-xl">
        <Tracker data={uptime} disabledTooltip />
      </div>
    ),
  },
]
