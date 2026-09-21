import { useState } from "react"
import { Button } from "@/components/button"
import { ElapsedTime } from "@/components/elapsed-time"
import type { ComponentExample } from "./types"

/**
 * A pinned pair, so every static example below is a pure function of its props
 * and renders the same string in the prerender and in the browser. That is what
 * `now` is for, and it is also how you render a run that has already finished.
 */
const STARTED_AT = new Date("2026-03-13T09:41:00Z")
const at = (seconds: number) => new Date(STARTED_AT.getTime() + seconds * 1000)

const DURATIONS = [
  { seconds: 9, note: "under a minute" },
  { seconds: 252, note: "the four-minute Bash call" },
  { seconds: 3723, note: "past an hour, so the hours appear" },
]

function RunningClock() {
  const [startedAt, setStartedAt] = useState<number | null>(null)

  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-lg text-quebi-fg tabular-nums">
        {startedAt === null ? "—" : <ElapsedTime start={startedAt} isRunning />}
      </span>
      <Button
        size="sm"
        intent={startedAt === null ? "primary" : "outline"}
        onPress={() => setStartedAt(startedAt === null ? Date.now() : null)}
      >
        {startedAt === null ? "Start" : "Reset"}
      </Button>
    </div>
  )
}

export const elapsedTimeExamples: ComponentExample[] = [
  {
    title: "Running",
    description:
      "With no `now` the component renders the zero duration until it has mounted, then picks up the reference point in an effect and ticks once a second. It is a `<time>` element, not a live region: a duration that announces itself every second is a metronome, not information.",
    render: () => <RunningClock />,
  },
  {
    title: "A run that has finished",
    description:
      "Pass `now` and the output is a pure function of its props — identical in a prerender and in the browser that hydrates it, and stable because there is nothing left to tick.",
    render: () => (
      <div className="flex flex-col gap-2">
        {DURATIONS.map(({ seconds, note }) => (
          <div key={seconds} className="flex items-baseline gap-3">
            <ElapsedTime
              start={STARTED_AT}
              now={at(seconds)}
              className="w-20 text-lg text-quebi-fg"
            />
            <span className="text-sm text-quebi-fg-subtle">{note}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Clock, or units",
    description:
      "`clock` is the shape to put next to a running Activity Pulse: compact, tabular, and only the digits that changed appear to change. `units` spells the units through `Intl` in the locale you name, for prose and for a duration that is read once rather than watched.",
    render: () => (
      <div className="flex flex-col gap-2">
        {DURATIONS.map(({ seconds }) => (
          <div key={seconds} className="flex items-baseline gap-6">
            <ElapsedTime
              start={STARTED_AT}
              now={at(seconds)}
              className="w-20 text-quebi-fg-muted"
            />
            <ElapsedTime
              start={STARTED_AT}
              now={at(seconds)}
              format="units"
              className="w-32 text-quebi-fg-muted"
            />
            <ElapsedTime
              start={STARTED_AT}
              now={at(seconds)}
              format="units"
              locale="en"
              className="w-32 text-quebi-fg-muted"
            />
          </div>
        ))}
      </div>
    ),
  },
]
