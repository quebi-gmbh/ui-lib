import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityPulse, useActivityPulse } from "@/components/activity-pulse"
import { Button } from "@/components/button"
import { ElapsedTime } from "@/components/elapsed-time"
import type { ComponentExample } from "./types"

/**
 * A scripted run, one entry per 250ms tick, in the "work units" the motivating
 * surface pushes: `charactersWritten + toolCalls * 240`.
 *
 * The shape is the point. A turn streams some prose, then goes into tools —
 * where it emits no prose at all — then comes back and writes its summary. A
 * chars-only feed flatlines through the whole middle section, which is exactly
 * where the reader most needs to know the thing has not hung, so a tool *start*
 * is worth about a sentence (~240 characters) and shows up as a spike.
 *
 * Weighting like that is application reasoning, not the library's: the hook
 * takes one monotonically-increasing number and composing it is yours.
 */
const RUN_SCRIPT = [
  // Streaming prose.
  120, 210, 90, 260, 150, 80, 30,
  // Four tool calls in a row. Everything between the spikes is real silence.
  240, 0, 0, 0, 240, 0, 0, 0, 0, 0, 240, 0, 0, 0, 0, 0, 0, 240, 0, 0,
  // The summary, tailing off.
  180, 340, 420, 260, 140, 70, 20, 0, 0, 0,
]

/**
 * Bursts and lulls, ten seconds of them, for the strips that are demonstrating
 * a shape rather than a scenario. Longer than the twenty-slot window, so the
 * loop is never entirely on screen at once.
 */
const BUSY_LOOP = [
  40, 180, 520, 300, 90, 0, 0, 0, 240, 610, 880, 420, 150, 60, 20, 0, 0, 0, 0, 120, 380, 240, 90,
  30, 0, 0, 70, 260, 540, 700, 330, 120, 0, 0, 0, 0, 0, 45, 160, 90,
]

/** Real work, and two orders of magnitude below a burst. */
const TRICKLE_LOOP = [4, 6, 3, 8, 5, 2, 7, 4, 9, 3, 6, 5, 2, 8, 4, 6, 3, 7, 5, 4, 2, 9, 5, 3]

/**
 * A looping scripted feed, which is what every strip on this page is driven by.
 *
 * `useActivityPulse` samples a counter once per tick and keeps the delta; in an
 * app that counter is something another part of the system is incrementing —
 * characters appended to a transcript, tool calls started, bytes received. Here
 * the script advances it, so these examples are the same shape with the work
 * faked and no `Math.random()` anywhere near them.
 *
 * A literal `samples` array would have been less code and the wrong demo: a
 * strip that never moves is the one thing this component must never be.
 */
function useScriptedPulse(script: readonly number[], isActive = true) {
  const tick = useRef(0)
  const total = useRef(0)

  const read = useCallback(() => {
    total.current += script[tick.current % script.length]
    tick.current += 1
    return total.current
  }, [script])

  return useActivityPulse(read, isActive)
}

function AgentStatusBar() {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const isRunning = startedAt !== null
  const samples = useScriptedPulse(RUN_SCRIPT, isRunning)

  // Started on mount rather than during render: `Date.now()` in a render body
  // is the hydration bug ElapsedTime exists to keep out of the markup.
  useEffect(() => {
    setStartedAt(Date.now())
  }, [])

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-3 rounded-quebi-md border border-quebi-line/10 bg-quebi-bg px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-quebi-fg">
          {isRunning ? "Running Bash — bun run test" : "Idle"}
        </span>
        <ActivityPulse
          samples={samples}
          isActive={isRunning}
          label={isRunning ? "Running Bash" : "Idle"}
          className={isRunning ? "text-quebi-brand-text" : "text-quebi-fg-subtle"}
        />
        {startedAt === null ? (
          <span className="w-12 text-right text-sm text-quebi-fg-subtle tabular-nums">—</span>
        ) : (
          <span className="w-12 text-right text-sm text-quebi-fg-muted">
            <ElapsedTime start={startedAt} isRunning />
          </span>
        )}
      </div>
      <Button
        intent={isRunning ? "outline" : "primary"}
        size="sm"
        className="self-start"
        onPress={() => setStartedAt(isRunning ? null : Date.now())}
      >
        {isRunning ? "Stop the run" : "Start the run"}
      </Button>
    </div>
  )
}

function Shapes() {
  // One buffer, four readings — so any difference between the rows is the
  // shape and not the data.
  const samples = useScriptedPulse(BUSY_LOOP)

  return (
    <div className="flex flex-col gap-3 text-quebi-brand-text">
      {(["bars", "dots", "wave", "line"] as const).map((shape) => (
        <div key={shape} className="flex items-center gap-3">
          <span className="w-12 text-xs text-quebi-fg-subtle">{shape}</span>
          <ActivityPulse samples={samples} shape={shape} />
        </div>
      ))}
    </div>
  )
}

function IdleVersusQuiet() {
  const busy = useScriptedPulse(BUSY_LOOP)
  const quiet = useScriptedPulse(TRICKLE_LOOP)

  return (
    <div className="flex flex-col gap-3 text-quebi-brand-text">
      <div className="flex items-center gap-3">
        <span className="w-24 text-xs text-quebi-fg-subtle">busy</span>
        <ActivityPulse samples={busy} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-xs text-quebi-fg-subtle">active, quiet</span>
        <ActivityPulse samples={quiet} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-xs text-quebi-fg-subtle">idle</span>
        {/* The one strip on this page that is meant to be still. */}
        <ActivityPulse samples={busy} isActive={false} />
      </div>
    </div>
  )
}

function Scales() {
  const trickle = useScriptedPulse(TRICKLE_LOOP)
  const busy = useScriptedPulse(BUSY_LOOP)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6 text-quebi-brand-text">
        <span className="w-24 text-xs text-quebi-fg-subtle">rolling</span>
        <ActivityPulse samples={trickle} />
        <ActivityPulse samples={busy} />
      </div>
      <div className="flex items-center gap-6 text-quebi-brand-text">
        <span className="w-24 text-xs text-quebi-fg-subtle">max 900</span>
        <ActivityPulse samples={trickle} scale={{ max: 900 }} />
        <ActivityPulse samples={busy} scale={{ max: 900 }} />
      </div>
    </div>
  )
}

function SizesAndDirection() {
  const samples = useScriptedPulse(BUSY_LOOP)

  return (
    <div className="flex flex-col gap-3 text-quebi-brand-text">
      <div className="flex items-center gap-4">
        <ActivityPulse samples={samples} size="sm" />
        <ActivityPulse samples={samples} size="md" />
        <ActivityPulse samples={samples} size="lg" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 text-xs text-quebi-fg-subtle">rtl</span>
        <ActivityPulse samples={samples} direction="rtl" />
      </div>
    </div>
  )
}

function FillStrips() {
  // Both strips share one buffer, so the only difference between them is how a
  // slot with nothing behind it yet is drawn.
  const samples = useScriptedPulse(BUSY_LOOP)

  return (
    <div className="flex flex-col gap-3 text-quebi-brand-text">
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-quebi-fg-subtle">right</span>
        <ActivityPulse samples={samples} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-quebi-fg-subtle">zeros</span>
        <ActivityPulse samples={samples} fill="zeros" />
      </div>
    </div>
  )
}

function Fill() {
  // `fill` is a statement about the first five seconds of a run, which have
  // gone by long before anyone reads this. Remounting is how you see them
  // again, and `key` is the whole mechanism.
  const [run, setRun] = useState(0)

  return (
    <div className="flex flex-col items-start gap-3">
      <FillStrips key={run} />
      <Button intent="outline" size="sm" onPress={() => setRun((previous) => previous + 1)}>
        Restart the run
      </Button>
    </div>
  )
}

export const activityPulseExamples: ComponentExample[] = [
  {
    title: "In a status bar",
    description:
      "The surface this exists for: a label saying what, a clock saying how long, and a third element saying that anything is still moving. Watch the strip stream, flatline through four tool calls with only their starts spiking, then pick up again for the summary — and press stop to see what the same bar says when there is nothing left to report.",
    render: () => <AgentStatusBar />,
  },
  {
    title: "Shapes",
    description:
      "One live buffer, four readings. `bars` is the default; `dots` puts the value in the opacity so the strip fits on a line of text; `wave` mirrors about a centre axis; `line` is for when it sits next to a Sparkline and must not compete with it.",
    render: () => <Shapes />,
  },
  {
    title: "Idle is not the same as quiet",
    description:
      "A strip that has stopped must not read as a strip with nothing much happening. The middle row is real work two orders of magnitude below the top one, and it is still moving; the bottom row is the top row's data with `isActive={false}`, and it is the only still strip on this page. That contrast is the whole reason the bars have a 1px floor.",
    render: () => <IdleVersusQuiet />,
  },
  {
    title: "Rolling scale, and when to turn it off",
    description:
      "The default normalises against the buffer's own maximum, floored at 120, so rhythm survives a hundredfold change in volume — the trickle on the left stays legible as a trickle rather than being amplified into a flood. Pass `scale={{ max }}` only when the reader really is comparing two pulses, where self-normalising would lie about which one is busier.",
    render: () => <Scales />,
  },
  {
    title: "Sizes, and the direction the comet points",
    description:
      "`sm`, `md` and `lg` move the height, bar width and gap together; `height` still overrides. `direction=\"rtl\"` mirrors the fill and the opacity ramp together — in an RTL layout, a comet tail pointing the other way is a comet pointing at the past.",
    render: () => <SizesAndDirection />,
  },
  {
    title: "How a strip fills in from empty",
    description:
      "By default the samples are right-aligned and a slot with nothing behind it yet draws nothing, so a fresh mount fills in from the right over its first five seconds. `fill=\"zeros\"` pre-fills instead, which is the shape to pick when the strip must not appear to grow. Press restart to watch the two diverge again.",
    render: () => <Fill />,
  },
]
