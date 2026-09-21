import { useCallback, useRef, useState } from "react"
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
 * A counter that counts up, which is all `useActivityPulse` wants.
 *
 * In an app this reads something another part of the system is incrementing —
 * characters appended to a transcript, tool calls started, bytes received. Here
 * the script advances it, so the example is the same shape with the work faked
 * and no `Math.random()` anywhere near it.
 */
function useScriptedWork() {
  const tick = useRef(0)
  const total = useRef(0)

  return useCallback(() => {
    total.current += RUN_SCRIPT[tick.current % RUN_SCRIPT.length]
    tick.current += 1
    return total.current
  }, [])
}

function AgentStatusBar() {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const isRunning = startedAt !== null
  const read = useScriptedWork()
  const samples = useActivityPulse(read, isRunning)

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
        {/* No clock before there is a start: `Date.now()` in a render body is
            the hydration bug ElapsedTime exists to keep out of the markup. */}
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
        {isRunning ? "Stop" : "Start the run"}
      </Button>
    </div>
  )
}

/** Bursty enough to show the comet tail without being noise. */
const BURSTY = [0, 0, 40, 180, 520, 300, 90, 0, 0, 0, 0, 0, 0, 240, 610, 880, 420, 150, 60, 20]

/** A trickle: real work, but two orders of magnitude below a burst. */
const TRICKLE = [4, 6, 3, 8, 5, 2, 7, 4, 9, 3, 6, 5, 2, 8, 4, 6, 3, 7, 5, 4]

export const activityPulseExamples: ComponentExample[] = [
  {
    title: "In a status bar",
    description:
      "The surface this exists for: a label saying what, a clock saying how long, and a third element saying that anything is still moving. Press start — the strip streams, flatlines through four tool calls with only their starts spiking, then picks up again for the summary.",
    render: () => <AgentStatusBar />,
  },
  {
    title: "Shapes",
    description:
      "One buffer, four readings. `bars` is the default; `dots` puts the value in the opacity so the strip fits on a line of text; `wave` mirrors about a centre axis; `line` is for when it sits next to a Sparkline and must not compete with it.",
    render: () => (
      <div className="flex flex-col gap-3 text-quebi-brand-text">
        {(["bars", "dots", "wave", "line"] as const).map((shape) => (
          <div key={shape} className="flex items-center gap-3">
            <span className="w-12 text-xs text-quebi-fg-subtle">{shape}</span>
            <ActivityPulse samples={BURSTY} shape={shape} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Idle is not the same as quiet",
    description:
      "A strip that has stopped must not read as a strip with nothing much happening. Active-and-quiet is a row of dots at full strength; idle is the same row dimmed. The middle one is the whole reason the bars have a 1px floor.",
    render: () => (
      <div className="flex flex-col gap-3 text-quebi-brand-text">
        <div className="flex items-center gap-3">
          <span className="w-24 text-xs text-quebi-fg-subtle">busy</span>
          <ActivityPulse samples={BURSTY} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-xs text-quebi-fg-subtle">active, quiet</span>
          <ActivityPulse samples={TRICKLE} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 text-xs text-quebi-fg-subtle">idle</span>
          <ActivityPulse samples={BURSTY} isActive={false} />
        </div>
      </div>
    ),
  },
  {
    title: "Rolling scale, and when to turn it off",
    description:
      "The default normalises against the buffer's own maximum, floored at 120, so rhythm survives a hundredfold change in volume — the trickle on the left is still legible as a trickle rather than amplified into a flood. Pass `scale={{ max }}` only when the reader really is comparing two pulses, where self-normalising would lie about which one is busier.",
    render: () => (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-6 text-quebi-brand-text">
          <span className="w-24 text-xs text-quebi-fg-subtle">rolling</span>
          <ActivityPulse samples={TRICKLE} />
          <ActivityPulse samples={BURSTY} />
        </div>
        <div className="flex items-center gap-6 text-quebi-brand-text">
          <span className="w-24 text-xs text-quebi-fg-subtle">max 900</span>
          <ActivityPulse samples={TRICKLE} scale={{ max: 900 }} />
          <ActivityPulse samples={BURSTY} scale={{ max: 900 }} />
        </div>
      </div>
    ),
  },
  {
    title: "Sizes, and the direction the comet points",
    description:
      "`sm`, `md` and `lg` move the height, bar width and gap together; `height` still overrides. `direction=\"rtl\"` mirrors the fill and the opacity ramp together — in an RTL layout, a comet tail pointing the other way is a comet pointing at the past.",
    render: () => (
      <div className="flex flex-col gap-3 text-quebi-brand-text">
        <div className="flex items-center gap-4">
          <ActivityPulse samples={BURSTY} size="sm" />
          <ActivityPulse samples={BURSTY} size="md" />
          <ActivityPulse samples={BURSTY} size="lg" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-12 text-xs text-quebi-fg-subtle">rtl</span>
          <ActivityPulse samples={BURSTY} direction="rtl" />
        </div>
      </div>
    ),
  },
  {
    title: "How a half-full buffer sits in the strip",
    description:
      "Six ticks into a run. By default the samples are right-aligned and the rest of the strip is empty, so a fresh mount fills in from the right; `fill=\"zeros\"` pre-fills instead, which is the shape to pick when the strip must not appear to grow.",
    render: () => (
      <div className="flex flex-col gap-3 text-quebi-brand-text">
        <div className="flex items-center gap-3">
          <span className="w-16 text-xs text-quebi-fg-subtle">right</span>
          <ActivityPulse samples={BURSTY.slice(-6)} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-16 text-xs text-quebi-fg-subtle">zeros</span>
          <ActivityPulse samples={BURSTY.slice(-6)} fill="zeros" />
        </div>
      </div>
    ),
  },
]
