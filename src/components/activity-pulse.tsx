"use client"

import { useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * ActivityPulse — quebi design system
 *
 * A rolling strip of twenty slots answering the one question a spinner cannot:
 * *is anything still moving?* Oldest sample on the left, newest on the right,
 * one slot per tick — at the default 250ms that is a five-second window.
 *
 * It sits between the two ends of the progress axis this library already has.
 * `ProgressBar`, `ProgressCircle`, `Meter` and `Tracker` all need a number you
 * already know. `Loader` and `Skeleton` need nothing and therefore say nothing:
 * a spinner reads exactly the same after four seconds and after four minutes.
 * This one is fed by work that actually happened, so it looks different when
 * the work stops — which is the whole point of putting it next to a label and
 * a clock in an agent or stream status bar.
 *
 * ## Pure component, separate hook
 *
 * `ActivityPulse` holds no state and starts no timers: N samples in, N bars
 * out. `useActivityPulse` turns any monotonically-increasing counter into the
 * rolling delta buffer it wants. Keeping them apart is what lets the same strip
 * be driven by output characters, tool starts, network bytes, rows streamed or
 * a counter in a gallery example.
 *
 * ## The five decisions
 *
 * 1. **The scale is the buffer's own rolling max, floored at `minScale`.**
 *    Self-normalising means a slow trickle and a token flood both use the full
 *    height, so the strip reads as *rhythm* rather than as throughput — which
 *    is the only thing it is qualified to report. The floor is what stops one
 *    quiet tick after a burst from rescaling everything into a cliff that reads
 *    as a crash. Pass `scale={{ max }}` for the rarer case where the reader
 *    genuinely is comparing two pulses and self-normalising would lie.
 * 2. **A bar is never zero-height** (`1 + round(…)`). A dead tick is a 1px dot.
 *    Idle has to look like idle, not like broken rendering.
 * 3. **Opacity is a pure positional ramp** with no data in it — that is the
 *    comet tail, and it is what makes the eye read left→right as *time* even
 *    when every bar is the same height. (`shape="dots"` is the one exception:
 *    there the value *is* the opacity, which is what makes it fit on a 12px
 *    line of text.)
 * 4. **The animation is a CSS transition and the array index is the key.** When
 *    the buffer shifts, slot `i` keeps its DOM node and gets a new height; CSS
 *    tweens it. Twenty elements, twenty style mutations per tick, no
 *    `requestAnimationFrame` and no keyframes. Index-as-key is *correct* here
 *    because the bars are the positions, not the samples.
 * 5. **The strip is decoration** (`aria-hidden`). Liveness for a screen reader
 *    is the `label` prop, which renders an `sr-only` `role="status"` region
 *    carrying the label and nothing else — never the clock and never the pulse,
 *    or a 4Hz tick turns the reader into a metronome. The region is always in
 *    the tree, empty until there is a label, because a live region inserted and
 *    filled in the same commit is not reliably announced.
 *
 * Under `motion-reduce` the transition is dropped and the bars jump: the
 * information is in the shape, not in the motion.
 *
 * ## Colour
 *
 * The bars are `bg-current`, so the strip adopts whatever `text-*` token is on
 * it — `text-quebi-brand-text` while something is running, `text-quebi-fg-muted`
 * for a background job. There is no `tone` prop and no colour of its own.
 *
 * @example
 * const samples = useActivityPulse(() => charsWritten + toolCalls * 240, isRunning)
 * <ActivityPulse samples={samples} isActive={isRunning} label="Running Bash" />
 */

/** Slots in the strip — twenty ticks of history. */
export const PULSE_SLOTS = 20

/** Height of the `md` strip, in px. Bars are px, so the container is too. */
export const PULSE_HEIGHT_PX = 16

/** One slot per tick. 250ms gives a five-second window over twenty slots. */
export const PULSE_TICK_MS = 250

/**
 * The floor under the rolling maximum. Without it, a buffer holding nothing but
 * a few stray characters normalises those characters to full height and the
 * strip reports a flood; with it, "barely anything happened" looks like barely
 * anything happened until real work arrives.
 */
const PULSE_MIN_SCALE = 120

/** The comet tail: oldest slot at 0.25, newest at 0.25 + 0.65 * (n-1)/n. */
const RAMP_FLOOR = 0.25
const RAMP_RANGE = 0.65

/**
 * `bars` is the default. `dots` puts the value in the opacity of same-size dots,
 * for a strip that has to sit on a line of text. `wave` mirrors each bar about a
 * centre axis, the audio-meter reading. `line` draws a polyline through the
 * samples, for when the strip sits next to a Sparkline and must not compete
 * with it — it is the one shape with no CSS transition, since `points` is not
 * an animatable property.
 */
export type ActivityPulseShape = "bars" | "dots" | "wave" | "line"

export type ActivityPulseSize = "sm" | "md" | "lg"

/** `"rolling"` self-normalises against the buffer; `{ max }` is absolute. */
export type ActivityPulseScale = "rolling" | { max: number }

interface SizeSpec {
  height: number
  bar: number
  gap: number
  dot: number
}

const SIZES: Record<ActivityPulseSize, SizeSpec> = {
  sm: { height: 12, bar: 2, gap: 1, dot: 2 },
  md: { height: PULSE_HEIGHT_PX, bar: 2, gap: 1, dot: 3 },
  lg: { height: 24, bar: 3, gap: 2, dot: 4 },
}

/**
 * Right-align the samples into a fixed-length strip.
 *
 * A slot with no sample behind it is `null`, not `0`, because those are two
 * different statements: `0` is "a tick happened and nothing came of it" and
 * renders as the 1px dot, while `null` is "this strip has not been running that
 * long" and renders as nothing at all. `fill="zeros"` collapses the difference
 * for callers who want the full row of dots from the first frame.
 */
function padSamples(
  samples: readonly number[],
  slots: number,
  prefilled: boolean,
): (number | null)[] {
  const tail = samples.slice(-slots)
  const missing = Math.max(0, slots - tail.length)
  return [...new Array(missing).fill(prefilled ? 0 : null), ...tail]
}

/** The rolling maximum, floored — or the absolute maximum the caller named. */
function resolveScale(
  cells: readonly (number | null)[],
  scale: ActivityPulseScale,
  minScale: number,
): number {
  if (scale !== "rolling") return Math.max(1, scale.max)
  let max = minScale
  for (const cell of cells) if (cell !== null && cell > max) max = cell
  return Math.max(1, max)
}

export interface ActivityPulseProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Work per tick, oldest first. Longer than `slots` is truncated from the left. */
  samples: readonly number[]
  /** How many slots the strip has. Defaults to {@link PULSE_SLOTS}. */
  slots?: number
  /** Height/bar-width/gap triple off the spacing scale. Defaults to `md`. */
  size?: ActivityPulseSize
  /** Override the strip height in px. The container uses the same value. */
  height?: number
  /** Which mark carries the value. Defaults to `bars`. */
  shape?: ActivityPulseShape
  /** `"rolling"` (default) self-normalises; `{ max }` compares across pulses. */
  scale?: ActivityPulseScale
  /** Floor under the rolling maximum. Ignored when `scale` is absolute. */
  minScale?: number
  /** `rtl` mirrors both the fill and the opacity ramp. */
  direction?: "ltr" | "rtl"
  /** Whether work is still running. `false` switches the strip to its idle state. */
  isActive?: boolean
  /** Idle rendering: a flat row of dimmed dots (default) or the last samples held. */
  idle?: "flat" | "hold"
  /** `right` fills in from the right on a fresh mount; `zeros` pre-fills the strip. */
  fill?: "right" | "zeros"
  /**
   * What a screen reader is told. Rendered into an `sr-only` `role="status"`
   * region — the label only, never the pulse and never the clock. The region
   * itself is always present, so a label that arrives when work starts is
   * announced rather than merely inserted.
   */
  label?: string
}

export function ActivityPulse({
  samples,
  slots = PULSE_SLOTS,
  size = "md",
  height,
  shape = "bars",
  scale = "rolling",
  minScale = PULSE_MIN_SCALE,
  direction = "ltr",
  isActive = true,
  idle = "flat",
  fill = "right",
  label,
  className,
  ...props
}: ActivityPulseProps) {
  const gradientId = useId()
  const spec = SIZES[size]
  const stripHeight = height ?? spec.height
  const rtl = direction === "rtl"

  // Idle is a statement, not the absence of one: a full row of 1px dots at
  // reduced opacity, which is visibly different from "active but quiet" —
  // the same dots, brighter. `idle="hold"` freezes the last samples instead.
  const cells: (number | null)[] =
    isActive || idle === "hold"
      ? padSamples(samples, slots, fill === "zeros")
      : new Array(slots).fill(0)

  const max = resolveScale(cells, scale, minScale)
  const ordered = rtl ? [...cells].reverse() : cells

  /** Positional opacity: oldest end faint, newest end bright. No data in it. */
  const ramp = (index: number) => RAMP_FLOOR + (index / ordered.length) * RAMP_RANGE

  /** Never zero: a tick that did nothing is a dot, not a gap. */
  const barHeight = (value: number) =>
    1 + Math.round((Math.min(value, max) / max) * (stripHeight - 1))

  const dimmed = !isActive && "opacity-50"
  const strip = cn("flex shrink-0", shape === "bars" ? "items-end" : "items-center", dimmed)

  return (
    <span
      {...props}
      data-slot="activity-pulse"
      className={cn("inline-flex items-center gap-2", className)}
    >
      {shape === "line" ? (
        <PulseLine
          cells={ordered}
          spec={spec}
          stripHeight={stripHeight}
          barHeight={barHeight}
          gradientId={gradientId}
          rtl={rtl}
          className={cn("shrink-0", dimmed)}
        />
      ) : (
        <span
          data-slot="activity-pulse-strip"
          aria-hidden="true"
          className={strip}
          style={{ height: stripHeight, gap: spec.gap }}
        >
          {ordered.map((cell, index) => (
            <span
              // Index-as-key is the correct key here and the reason is the
              // component: a slot is a *position* in the strip, not a sample.
              // Keying by position is what lets the DOM node survive the shift
              // and receive a new height, which is what the CSS transition
              // tweens. Keying by the sample would remount twenty nodes per
              // tick and there would be no animation at all.
              // biome-ignore lint/suspicious/noArrayIndexKey: the bars are the positions, not the samples — see above.
              key={index}
              data-slot="activity-pulse-bar"
              data-empty={cell === null ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full bg-current",
                "transition-[height,opacity] duration-200 motion-reduce:transition-none",
              )}
              style={
                shape === "dots"
                  ? {
                      width: spec.dot,
                      height: spec.dot,
                      // The one shape where the value lives in the opacity: a
                      // dot that changed size would change the line height of
                      // the text it is sitting on.
                      opacity:
                        cell === null ? 0 : ramp(index) * (0.2 + 0.8 * (Math.min(cell, max) / max)),
                    }
                  : {
                      width: spec.bar,
                      height: cell === null ? 1 : barHeight(cell),
                      opacity: cell === null ? 0 : ramp(index),
                    }
              }
            />
          ))}
        </span>
      )}
      {/* Always in the tree, even with no label yet. A live region inserted
          and populated in the same commit is not reliably announced, and the
          shape every caller writes is exactly that — `label={isRunning ?
          "Running Bash" : undefined}`. An empty region costs one span. */}
      <span role="status" className="sr-only">
        {label ?? ""}
      </span>
    </span>
  )
}

/**
 * The `line` shape. Drawn over the slots that have samples behind them, so a
 * strip that is still filling in does not start life as a flat line across its
 * whole width. The comet tail is a stroke gradient rather than a per-mark
 * opacity, since there is only one mark.
 */
function PulseLine({
  cells,
  spec,
  stripHeight,
  barHeight,
  gradientId,
  rtl,
  className,
}: {
  cells: readonly (number | null)[]
  spec: SizeSpec
  stripHeight: number
  barHeight: (value: number) => number
  gradientId: string
  rtl: boolean
  className?: string
}) {
  const step = spec.bar + spec.gap
  const width = Math.max(1, cells.length * step - spec.gap)
  const points = cells
    .map((cell, index) =>
      cell === null
        ? null
        : `${index * step + spec.bar / 2},${(stripHeight - barHeight(cell)).toFixed(2)}`,
    )
    .filter((point): point is string => point !== null)

  return (
    <svg
      data-slot="activity-pulse-strip"
      aria-hidden="true"
      className={className}
      width={width}
      height={stripHeight}
      viewBox={`0 0 ${width} ${stripHeight}`}
      style={{ height: stripHeight, width }}
    >
      <defs>
        <linearGradient id={gradientId} x1={rtl ? "1" : "0"} y1="0" x2={rtl ? "0" : "1"} y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity={RAMP_FLOOR} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={RAMP_FLOOR + RAMP_RANGE} />
        </linearGradient>
      </defs>
      {points.length > 1 ? (
        <polyline
          data-slot="activity-pulse-line"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={spec.bar / 2 + 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
      ) : null}
    </svg>
  )
}

export interface UseActivityPulseOptions {
  /** Buffer length. Match the strip's `slots`. Defaults to {@link PULSE_SLOTS}. */
  slots?: number
  /** Sampling period in ms. Defaults to {@link PULSE_TICK_MS}. */
  tickMs?: number
}

/**
 * Turn a monotonically-increasing "work done" counter into the rolling delta
 * buffer `ActivityPulse` renders. Ticks only while `active`.
 *
 * `read` is anything that counts up: characters written, tool calls started,
 * bytes received, rows streamed. **Weighting is yours, not the library's** —
 * the motivating surface passes `chars + tools * 240`, because a turn that
 * spends two minutes inside a tool emits no prose at all and a chars-only feed
 * would flatline exactly when reassurance matters most (~240 chars being about
 * a sentence, which is roughly what one tool call is worth as a unit of
 * progress). That is application reasoning; this hook takes one number.
 *
 * Two things about the implementation are load-bearing:
 *
 * - **`read` is held in a ref and is not an effect dependency.** An inline
 *   arrow from the caller is a new function on every render, so a `read` in the
 *   deps would tear down and rebuild the interval — and reset the previous
 *   reading — on every render, flatlining the pulse under exactly the
 *   re-render pressure it exists to visualise.
 * - **The shift happens in the interval, never in a render body**, so
 *   StrictMode's double-invoke cannot double-shift the buffer. The cost is one
 *   tick of lag, which at 250ms is invisible.
 *
 * @example
 * const samples = useActivityPulse(() => stats.chars + stats.tools * 240, isRunning)
 */
export function useActivityPulse(
  read: () => number,
  active: boolean,
  { slots = PULSE_SLOTS, tickMs = PULSE_TICK_MS }: UseActivityPulseOptions = {},
): readonly number[] {
  const readRef = useRef(read)
  const previous = useRef<number | null>(null)
  const [samples, setSamples] = useState<readonly number[]>([])

  useEffect(() => {
    readRef.current = read
  })

  useEffect(() => {
    if (!active) return

    // A run starts empty and fills in from the right. Holding the previous
    // run's tail would show a five-second window that ended some time ago.
    //
    // The baseline is taken here rather than left for the first tick to
    // establish, so that the first slot is a real delta: reading it on the
    // first tick would emit one guaranteed zero — a dead tick at the exact
    // moment a reader is looking to see whether anything is happening.
    previous.current = readRef.current()
    setSamples([])

    const id = setInterval(() => {
      const current = readRef.current()
      const base = previous.current ?? current
      previous.current = current
      const delta = Math.max(0, current - base)
      setSamples((buffer) => [...buffer, delta].slice(-slots))
    }, tickMs)

    return () => clearInterval(id)
  }, [active, slots, tickMs])

  return samples
}
