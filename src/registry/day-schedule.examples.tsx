import { useState } from "react"
import { DaySchedule, formatDayTime, type DaySpan } from "@/components/day-schedule"
import type { ComponentExample } from "./types"

const WORKDAY: DaySpan[] = [
  { id: "deep-work", label: "deep work", start: 510, end: 690 },
  { id: "review", label: "review", start: 600, end: 750 },
  { id: "lunch", label: "lunch", start: 750, end: 810 },
  { id: "pairing", label: "pairing", start: 780, end: 960 },
  { id: "deploy", label: "deploy window", start: 930, end: 1080 },
]

const EditableSchedule = () => {
  const [spans, setSpans] = useState<DaySpan[]>(WORKDAY)

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="font-bold text-quebi-fg tracking-tight">wed 20 aug</div>
        <span className="text-[10.5px] text-quebi-fg-subtle">snaps to 15 min</span>
      </div>
      <DaySchedule spans={spans} onSpansChange={setSpans} />
    </div>
  )
}

const CoarseSchedule = () => {
  const [spans, setSpans] = useState<DaySpan[]>([
    { id: "morning", label: "morning shift", start: 360, end: 720, tone: "brand" },
    { id: "evening", label: "evening shift", start: 840, end: 1200, tone: "cyan" },
  ])

  return (
    <div className="w-full max-w-md">
      <DaySchedule
        spans={spans}
        onSpansChange={setSpans}
        step={60}
        minDuration={120}
        height={360}
      />
    </div>
  )
}

const LiveTotals = () => {
  const [spans, setSpans] = useState<DaySpan[]>(WORKDAY.slice(0, 3))
  const total = spans.reduce((sum, s) => sum + (s.end - s.start), 0)

  return (
    <div className="w-full max-w-md">
      <DaySchedule spans={spans} onSpansChange={setSpans} height={400} />
      <p className="mt-4 text-sm text-quebi-fg-muted tabular-nums">
        {spans.length} spans — {formatDayTime(total)} scheduled
      </p>
    </div>
  )
}

export const dayScheduleExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Drag a bar to move a span, or either end node to resize it. Snaps to 15 minutes with a 30-minute minimum.",
    render: () => <EditableSchedule />,
  },
  {
    title: "Custom step and height",
    description: "Hour-level snapping with a two-hour minimum on a shorter track.",
    render: () => <CoarseSchedule />,
  },
  {
    title: "Controlled with derived output",
    description: "Because it is controlled, the total scheduled time updates as you drag.",
    render: () => <LiveTotals />,
  },
  {
    title: "Read-only",
    description: "Renders the schedule without drag handles or keyboard adjustment.",
    render: () => (
      <div className="w-full max-w-md">
        <DaySchedule defaultSpans={WORKDAY} isReadOnly height={400} />
      </div>
    ),
  },
  {
    title: "Disabled",
    description: "Non-interactive and dimmed.",
    render: () => (
      <div className="w-full max-w-md">
        <DaySchedule defaultSpans={WORKDAY.slice(0, 3)} isDisabled height={360} />
      </div>
    ),
  },
]
