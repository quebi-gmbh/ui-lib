import { useCallback, useRef } from "react"
import { ActivityPulse, useActivityPulse } from "@/components/activity-pulse"
import { SignalBars } from "@/components/signal-bars"
import type { ComponentExample } from "./types"

/**
 * The last example on this page contrasts a level with a rhythm, so the rhythm
 * has to be one: a frozen strip would make the pair look like two levels.
 */
const PULSE_LOOP = [
  40, 180, 520, 300, 90, 0, 0, 0, 240, 610, 880, 420, 150, 60, 20, 0, 0, 0, 0, 120, 380, 240, 90,
  30, 0, 0, 70, 260, 540, 700, 330, 120, 0, 0, 0, 0, 0, 45, 160, 90,
]

function LevelOrRhythm() {
  const tick = useRef(0)
  const total = useRef(0)
  const read = useCallback(() => {
    total.current += PULSE_LOOP[tick.current % PULSE_LOOP.length]
    tick.current += 1
    return total.current
  }, [])
  const samples = useActivityPulse(read, true)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SignalBars value={3} className="text-quebi-brand-text" label="Connection: 3 of 4" />
        <span className="text-sm text-quebi-fg-muted">SignalBars — a level, out of four</span>
      </div>
      <div className="flex items-center gap-3">
        <ActivityPulse samples={samples} className="text-quebi-brand-text" />
        <span className="text-sm text-quebi-fg-muted">ActivityPulse — a rhythm, out of nothing</span>
      </div>
    </div>
  )
}

const CONNECTIONS = [
  { name: "eu-central-1", value: 4, text: "Excellent" },
  { name: "us-east-1", value: 3, text: "Good" },
  { name: "ap-south-1", value: 2, text: "Degraded" },
  { name: "sa-east-1", value: 1, text: "Poor" },
  { name: "af-south-1", value: 0, text: "No connection" },
]

export const signalBarsExamples: ComponentExample[] = [
  {
    title: "A level, in four steps",
    description:
      "Filled from the left, with the unfilled steps left in place so the reader can see what the level is out of. The visible text is not decoration — it is the text equivalent, and with it present the graphic steps back out of the accessibility tree rather than being announced twice.",
    render: () => (
      <div className="flex flex-col gap-2">
        {CONNECTIONS.map((connection) => (
          <div key={connection.name} className="flex items-center gap-3">
            <span className="w-32 font-mono text-xs text-quebi-fg-muted">{connection.name}</span>
            <SignalBars value={connection.value} tone="level">
              <span className="text-sm text-quebi-fg-muted">{connection.text}</span>
            </SignalBars>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Without visible text",
    description:
      "With no children the graphic keeps a generated `role=\"img\"` label (\"3 of 4\"), so it still has a text equivalent. Pass `label` to say what the level is *of* — nothing else on the page may be saying it.",
    render: () => (
      <div className="flex items-center gap-6 text-quebi-brand-text">
        <SignalBars value={1} label="Connection: 1 of 4" />
        <SignalBars value={2} label="Connection: 2 of 4" />
        <SignalBars value={3} label="Connection: 3 of 4" />
        <SignalBars value={4} label="Connection: 4 of 4" />
      </div>
    ),
  },
  {
    title: "Five steps, and sizes",
    description:
      "`steps` is the scale, not a style: five is common for a confidence score. The three sizes move height, bar width and gap together.",
    render: () => (
      <div className="flex flex-col gap-4 text-quebi-brand-text">
        <div className="flex items-center gap-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <SignalBars key={value} value={value} steps={5} label={`Confidence: ${value} of 5`} />
          ))}
        </div>
        <div className="flex items-center gap-6">
          <SignalBars value={3} size="sm" label="3 of 4, small" />
          <SignalBars value={3} size="md" label="3 of 4, medium" />
          <SignalBars value={3} size="lg" label="3 of 4, large" />
        </div>
      </div>
    ),
  },
  {
    title: "A level, or a rhythm?",
    description:
      "The two components share a geometry so that the question which chooses between them is the only thing you have to answer. Signal Bars is a level: absolute, no time in it, the same picture a second later — as the top row is. Activity Pulse is a rhythm: a self-normalising window over the last five seconds, which is why it carries no number and never claims to.",
    render: () => <LevelOrRhythm />,
  },
]
