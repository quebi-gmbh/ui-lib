"use client"

import { useEffect, useState } from "react"
import { getNumberFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * ElapsedTime — quebi design system
 *
 * The clock that sits beside an `ActivityPulse`: how long this has been going
 * on. A formatter with a tick on top, and the newest member of the
 * `FormattedDate` / `FormattedNumber` / `FormattedStorage` family rather than a
 * second kind of thing — which is why the numbers go through `Intl` with a
 * locale that is named in the code, never through `toLocaleString()`.
 *
 * ## Why it does not read the clock during render
 *
 * This site is prerendered (`ssr: false` plus a `prerender()` list), so every
 * page is HTML generated in Node and hydrated in a browser some time later. A
 * component that computed `Date.now() - start` while rendering would bake one
 * number into the HTML and compute a different one at hydration — the same bug
 * `FormattedDate` avoids for "3 days ago", and it takes the same two shapes
 * here:
 *
 * - Pass `now` and the output is a pure function of its props, identical in
 *   both runtimes. That is also how you render a *finished* run: `now` is when
 *   it ended, and `isRunning={false}` stops the tick.
 * - Pass nothing and the zero duration is rendered until mount, after which the
 *   reference point is picked up in an effect, where there is only one runtime
 *   left to disagree with.
 *
 * ## It is not a live region
 *
 * A duration that announces itself every second is a metronome, not
 * information — the same reason `ActivityPulse` keeps its strip `aria-hidden`
 * and puts the label in the live region instead. This renders a semantic
 * `<time>` with a machine-readable `dateTime` duration and says nothing until
 * it is read.
 *
 * @example
 * <ElapsedTime start={startedAt} isRunning />                        // 4:12
 * <ElapsedTime start={startedAt} now={finishedAt} format="units" />  // 4 Min. 12 Sek.
 */

/**
 * `clock` is `4:12` / `1:02:03` — compact, monospaced, and the right shape next
 * to a running pulse. `units` spells the units out through `Intl`, for prose
 * and for a duration that is read once rather than watched.
 */
export type ElapsedTimeFormat = "clock" | "units"

/** Two units is the readable maximum: "1 Std. 4 Min.", never "1 Std. 4 Min. 9 Sek.". */
const MAX_UNITS = 2

export interface ElapsedTimeProps
  extends Omit<React.ComponentProps<"time">, "children" | "dateTime"> {
  /** When the run began. A Date, an ISO string, or a timestamp. */
  start: Date | string | number
  /**
   * The reference point. Pass it to make the output deterministic — and to
   * render a finished run, where it is the moment the run ended. Without it,
   * the zero duration renders until mount.
   */
  now?: Date | string | number
  /** Whether to keep ticking. Ignored when `now` is given, which pins the answer. */
  isRunning?: boolean
  /** How often to re-read the clock, in ms. */
  tickMs?: number
  format?: ElapsedTimeFormat
  /**
   * BCP 47 locale tag, pinned rather than read from the runtime for the reason
   * in the component docs. Defaults to `"de"`, as `FormattedDate` does.
   */
  locale?: string
}

/** `4:12`, or `1:02:03` once there are hours. Minor parts are always two digits. */
function formatClock(totalSeconds: number, locale: string): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60) % 60
  const seconds = totalSeconds % 60
  const plain = getNumberFormat(locale, { useGrouping: false })
  const padded = getNumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })

  return hours > 0
    ? `${plain.format(hours)}:${padded.format(minutes)}:${padded.format(seconds)}`
    : `${plain.format(minutes)}:${padded.format(seconds)}`
}

/** The two most significant non-zero units, each spelled by `Intl`. */
function formatUnits(totalSeconds: number, locale: string): string {
  const parts: { value: number; unit: "hour" | "minute" | "second" }[] = [
    { value: Math.floor(totalSeconds / 3600), unit: "hour" },
    { value: Math.floor(totalSeconds / 60) % 60, unit: "minute" },
    { value: totalSeconds % 60, unit: "second" },
  ]
  // Leading zeros are noise ("0 Std. 4 Min."); a zero *between* two units is
  // not, so the slice runs from the first non-zero part rather than filtering.
  const first = parts.findIndex((part) => part.value > 0)
  const shown = first === -1 ? parts.slice(-1) : parts.slice(first, first + MAX_UNITS)

  return shown
    .map((part) =>
      getNumberFormat(locale, {
        style: "unit",
        unit: part.unit,
        unitDisplay: "narrow",
        maximumFractionDigits: 0,
      }).format(part.value),
    )
    .join(" ")
}

/** The `datetime` attribute's value: an ISO 8601 duration. */
function isoDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60) % 60
  const seconds = totalSeconds % 60
  return `PT${hours > 0 ? `${hours}H` : ""}${minutes > 0 ? `${minutes}M` : ""}${seconds}S`
}

export function ElapsedTime({
  start,
  now,
  isRunning = false,
  tickMs = 1000,
  format = "clock",
  locale = "de",
  className,
  ...props
}: ElapsedTimeProps) {
  const [mountedNow, setMountedNow] = useState<number | null>(null)

  useEffect(() => {
    if (now !== undefined) return
    setMountedNow(Date.now())
    if (!isRunning) return
    const id = setInterval(() => setMountedNow(Date.now()), tickMs)
    return () => clearInterval(id)
  }, [now, isRunning, tickMs])

  const startedAt = new Date(start).getTime()
  const reference = now !== undefined ? new Date(now).getTime() : mountedNow
  const elapsed =
    reference === null || Number.isNaN(startedAt) || Number.isNaN(reference)
      ? 0
      : Math.max(0, Math.floor((reference - startedAt) / 1000))

  return (
    <time
      {...props}
      dateTime={isoDuration(elapsed)}
      // Tabular figures, because the whole point is that only the digits that
      // changed appear to change — proportional digits make a running clock
      // shuffle its own width once a second.
      className={cn("tabular-nums", className)}
    >
      {format === "clock" ? formatClock(elapsed, locale) : formatUnits(elapsed, locale)}
    </time>
  )
}
