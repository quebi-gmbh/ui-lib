import { Tracker, type TrackerBlockProps } from "@/components/tracker"
import type { ComponentExample } from "./types"

const uptime: TrackerBlockProps[] = Array.from({ length: 40 }, (_, i) => {
  if (i === 11 || i === 28)
    return { color: "bg-quebi-warn", tooltip: "Degraded performance" }
  if (i === 19) return { color: "bg-quebi-danger", tooltip: "Major outage" }
  return { color: "bg-quebi-success", tooltip: "Operational" }
})

const sparse: TrackerBlockProps[] = Array.from({ length: 30 }, (_, i) => {
  if (i % 7 === 3) return { color: "bg-quebi-action", tooltip: "Active" }
  if (i % 11 === 0) return { color: "bg-quebi-fg-subtle", tooltip: "Idle" }
  return { tooltip: "No activity" }
})

export const trackerExamples: ComponentExample[] = [
  {
    title: "Uptime",
    description:
      "Forty cells of service health, in the state tokens because the state is the point: success is operational, warn degraded, danger an outage. Hover a cell for its status.",
    render: () => (
      <div className="w-full max-w-xl">
        <Tracker data={uptime} />
      </div>
    ),
  },
  {
    title: "Sparse activity",
    description: "Activity is not a state, so it is ink: solid for active, subtle for idle. Empty cells fall back to the raised ground.",
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
