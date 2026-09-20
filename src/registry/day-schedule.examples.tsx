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

const BackToBack = () => {
  const [spans, setSpans] = useState<DaySpan[]>([
    { id: "standup", label: "standup", start: 540, end: 555 },
    { id: "one-on-one", label: "1:1", start: 545, end: 590 },
    { id: "triage", label: "triage", start: 555, end: 585 },
    { id: "retro", label: "retro", start: 560, end: 600 },
  ])

  return (
    <div className="w-full max-w-md">
      <DaySchedule spans={spans} onSpansChange={setSpans} height={360} />
    </div>
  )
}

const TypedTimes = () => {
  const [spans, setSpans] = useState<DaySpan[]>(WORKDAY.slice(0, 3))

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="font-bold text-quebi-fg tracking-tight">wed 20 aug</div>
        <span className="text-[10.5px] text-quebi-fg-subtle">type a time, or drag</span>
      </div>
      <DaySchedule spans={spans} onSpansChange={setSpans} timeLabels="editable" height={400} />
    </div>
  )
}

const UprightTimes = () => {
  const [spans, setSpans] = useState<DaySpan[]>(WORKDAY.slice(0, 3))

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="font-bold text-quebi-fg tracking-tight">wed 20 aug</div>
        <span className="text-[10.5px] text-quebi-fg-subtle">times read left to right</span>
      </div>
      <DaySchedule
        spans={spans}
        onSpansChange={setSpans}
        timeLabels="editable"
        timeLabelOrientation="upright"
        height={400}
      />
    </div>
  )
}

const UprightShortSpans = () => {
  const [spans, setSpans] = useState<DaySpan[]>([
    { id: "standup", label: "standup", start: 540, end: 555 },
    { id: "handover", label: "handover", start: 1020, end: 1050 },
  ])

  return (
    <div className="w-full max-w-md">
      <DaySchedule
        spans={spans}
        onSpansChange={setSpans}
        timeLabels="editable"
        timeLabelOrientation="upright"
        minDuration={15}
        height={400}
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
    title: "Names that want the same place",
    description:
      "Four spans inside one hour, so every name wants the same spot in the column beside them. They are pushed apart by a line's height instead of drawn on top of each other, and any name that had to move keeps a leader line back to its own bar. Drag one onto another and the column re-settles.",
    render: () => <BackToBack />,
  },
  {
    title: "Editable times",
    description:
      "timeLabels=\"editable\" turns the rotated times into TimeFields at the same 10.5px the static labels use, and widens the lanes to fit them. A typed time is taken as typed — the 15-minute step snaps a drag, not a keystroke — and commits when the field loses focus or on Enter.",
    render: () => <TypedTimes />,
  },
  {
    title: "Upright times",
    description:
      'timeLabelOrientation="upright" stops rotating the edge times, so they read left to right like any other field. It is its own axis: timeLabels still chooses what the time is, this chooses how it faces, and it applies to the static labels too. Upright, a time spends its whole width on the lane rather than one line box, so the default laneGap widens again.',
    render: () => <UprightTimes />,
  },
  {
    title: "Upright times on a short span",
    description:
      "A 15-minute standup is four pixels of a 400px track, and upright its start and end boxes are fifteen each — so the rotation was the only thing keeping them apart. They go through the same sweep the name column uses: start holds its minute, end is pushed clear, and both stay inside the track. Drag either end shorter and watch the pair refuse to stack.",
    render: () => <UprightShortSpans />,
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
