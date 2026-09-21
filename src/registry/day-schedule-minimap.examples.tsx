import { useRef, useState } from "react"
import { DayScheduleMinimap } from "@/components/day-schedule-minimap"
import { DaySchedule, formatDayTime, type DaySpan } from "@/components/day-schedule"
import type { ComponentExample } from "./types"

const WORKDAY: DaySpan[] = [
  { id: "standup", label: "standup", start: 540, end: 555 },
  { id: "deep-work", label: "deep work", start: 570, end: 720 },
  { id: "lunch", label: "lunch", start: 750, end: 810 },
  { id: "pairing", label: "pairing", start: 810, end: 960 },
  { id: "deploy", label: "deploy window", start: 990, end: 1080 },
]

/** Twenty rooms booked across the day — more lines than 34px can hold side by side. */
const BUSY: DaySpan[] = Array.from({ length: 20 }, (_, i) => ({
  id: `room-${i}`,
  label: `room ${i + 1}`,
  start: 420 + i * 34,
  end: 420 + i * 34 + 75,
}))

const BesideASchedule = () => {
  const [spans, setSpans] = useState<DaySpan[]>(WORKDAY)

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="font-bold text-quebi-fg tracking-tight">wed 20 aug</div>
        <span className="text-[10.5px] text-quebi-fg-subtle">3× zoom — drag the map to scroll</span>
      </div>
      <DaySchedule
        spans={spans}
        onSpansChange={setSpans}
        zoom={3}
        minimap
        startMinute={600}
        height={340}
      />
    </div>
  )
}

const BusyDay = () => (
  <div className="w-full max-w-md">
    <div className="mb-5 text-[10.5px] text-quebi-fg-subtle">
      Twenty spans in 34px: the lines keep their thickness and the grid rides instead, so the ones
      that do not fit park on an edge with their minute still true.
    </div>
    <DaySchedule
      defaultSpans={BUSY}
      zoom={4}
      minimap
      startMinute={780}
      height={340}
      laneGap={10}
      isReadOnly
    />
  </div>
)

/**
 * The map is not welded to DaySchedule: hand it a ref to anything that scrolls
 * and how many viewports tall its content is.
 */
const WiredByHand = () => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const scale = 3

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2">
        <div
          ref={viewportRef}
          className="min-w-0 flex-1 overflow-y-auto rounded-quebi-sm border border-quebi-line/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ height: 260 }}
        >
          <div className="relative" style={{ height: 260 * scale }}>
            {WORKDAY.map((span) => (
              <div
                key={span.id}
                className="absolute inset-x-2 flex items-start rounded-quebi-sm bg-quebi-brand/10 px-2 py-1 text-quebi-fg text-xs"
                style={{
                  top: `${(span.start / 1440) * 100}%`,
                  height: `${((span.end - span.start) / 1440) * 100}%`,
                }}
              >
                {span.label} · {formatDayTime(span.start)}
              </div>
            ))}
          </div>
        </div>
        <DayScheduleMinimap
          spans={WORKDAY.map((span, index) => ({
            id: span.id,
            start: span.start,
            end: span.end,
            tone: index % 2 === 0 ? ("brand" as const) : ("cyan" as const),
          }))}
          viewportRef={viewportRef}
          scale={scale}
        />
      </div>
    </div>
  )
}

export const dayScheduleMinimapExamples: ComponentExample[] = [
  {
    title: "Beside a schedule",
    description:
      "`minimap` on a DaySchedule with a zoom. The strip replaces the viewport's scrollbar rather than joining it, and the rectangle marks the hours on screen.",
    render: () => <BesideASchedule />,
  },
  {
    title: "More lines than width",
    description:
      "A fixed 5px line and a lane grid that pans with the hours on screen — so the same span reads the same on a quiet day and a busy one.",
    render: () => <BusyDay />,
  },
  {
    title: "Wired to any scroller",
    description:
      "The map takes a ref to the element that scrolls and the factor its content is taller by. Nothing about it is specific to DaySchedule.",
    render: () => <WiredByHand />,
  },
]
