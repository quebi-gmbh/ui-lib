import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * StatusDot — quebi design system
 *
 * A state carried *on something else*: an avatar's corner, a table row, a nav
 * item, an environment name. Not a `Badge` — a Badge is a labelled chip that
 * stands on its own, and half of what it costs is the chrome around the label.
 * This is the mark you put next to a name that is already there.
 *
 * ## The meaning never lives in the colour
 *
 * The dot is always accompanied by its own text. `children` makes that text
 * visible; with nothing passed, the tone's own word is rendered `sr-only`, so
 * the component cannot be shipped in the state where green and amber are the
 * only difference. The glyph itself is `aria-hidden` either way.
 *
 * Two more things follow from that rule rather than from taste:
 *
 * - `unknown` is a *hollow* ring rather than a fifth fill, so the one tone that
 *   means "we do not actually know" is distinguishable from the four that are
 *   claims, without reading a colour.
 * - In forced-colors mode a background colour is replaced by the system's, so
 *   every filled dot would be the same dot. The outline is drawn there (and
 *   only there) to keep the mark visible at all; the text beside it is what
 *   still carries the state.
 *
 * ## `isLive`
 *
 * The expanding ring says "this is live *now*", which is a different claim from
 * "this is online". Use it for a connection that is actively receiving, not as
 * decoration on every green dot — it animates forever, and something that
 * always moves stops meaning anything. It is dropped under `motion-reduce`,
 * where the dot itself remains.
 *
 * @example
 * <StatusDot tone="online">Online</StatusDot>
 * <StatusDot tone="busy" />                       // "Busy", sr-only
 * <StatusDot tone="online" isLive>Streaming</StatusDot>
 */

export type StatusDotTone = "online" | "idle" | "busy" | "offline" | "unknown"

export type StatusDotSize = "sm" | "md" | "lg"

/**
 * Fills on the quebi status tokens, which are re-declared per theme, so the dot
 * reads on the light page as well as on the dark one. `unknown` is the odd one
 * out by design: a ring, not a fill.
 */
const TONES: Record<StatusDotTone, string> = {
  online: "bg-quebi-success",
  idle: "bg-quebi-warn",
  busy: "bg-quebi-danger",
  offline: "bg-quebi-fg-subtle",
  unknown: "border border-quebi-fg-subtle bg-transparent",
}

/** The fallback text. A dot with no `children` still says this much. */
const TONE_LABELS: Record<StatusDotTone, string> = {
  online: "Online",
  idle: "Idle",
  busy: "Busy",
  offline: "Offline",
  unknown: "Unknown",
}

const SIZES: Record<StatusDotSize, string> = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
}

export interface StatusDotProps extends Omit<React.ComponentProps<"span">, "children"> {
  tone?: StatusDotTone
  size?: StatusDotSize
  /** An expanding ring for a connection that is live right now. */
  isLive?: boolean
  /** Visible text beside the dot. Omit it and the tone's word is rendered `sr-only`. */
  children?: ReactNode
}

export function StatusDot({
  tone = "unknown",
  size = "md",
  isLive = false,
  children,
  className,
  ...props
}: StatusDotProps) {
  const text = children ?? TONE_LABELS[tone]

  return (
    <span
      {...props}
      data-slot="status-dot"
      data-tone={tone}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span
        aria-hidden="true"
        className={cn("relative flex shrink-0", SIZES[size])}
        data-slot="status-dot-glyph"
      >
        {isLive ? (
          <span
            data-slot="status-dot-ring"
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-75 motion-reduce:hidden",
              TONES[tone],
            )}
          />
        ) : null}
        <span
          className={cn(
            "relative size-full rounded-full forced-colors:outline forced-colors:outline-1",
            TONES[tone],
          )}
        />
      </span>
      <span
        data-slot="status-dot-label"
        className={cn(children === undefined || children === null ? "sr-only" : undefined)}
      >
        {text}
      </span>
    </span>
  )
}
