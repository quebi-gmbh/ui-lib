import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * SignalBars — quebi design system
 *
 * A discrete level on an absolute scale: connection quality, confidence, load.
 * Four steps by default, filled from the left, with the unfilled steps left in
 * place so the reader can see what the level is *out of*.
 *
 * It shares its bar geometry with `ActivityPulse` on purpose, because that pair
 * is the thing worth being able to tell apart at a glance: **is this value a
 * level, or a rhythm?** SignalBars is a level — an absolute scale with no time
 * in it, the same picture a second later if nothing changed. ActivityPulse is a
 * rhythm — a self-normalising window over the last few seconds, which is why it
 * carries no number and never claims to. The bars look alike; the reading is
 * the difference, and the two components are named for it.
 *
 * ## Colour is never the signal
 *
 * The level is in the *height* of the filled bars, so it survives a monochrome
 * render, a colour-vision deficiency and forced-colors mode. On top of that the
 * graphic always carries a text equivalent: pass `children` for a visible one
 * (the graphic then steps back and is `aria-hidden`, so a screen reader hears
 * the label once rather than twice) or let it fall back to the generated
 * `role="img"` label.
 *
 * @example
 * <SignalBars value={3} tone="level">Good</SignalBars>
 * <SignalBars value={1} steps={5} label="Model confidence: 1 of 5" />
 */

export type SignalBarsSize = "sm" | "md" | "lg"

/**
 * `brand` inherits `currentColor` — the caller decides, which is right when the
 * level means "how much" rather than "how bad". `level` maps the fraction onto
 * the quebi status tokens, for the cases where a low value genuinely is a
 * problem (a dying connection, a struggling worker).
 */
export type SignalBarsTone = "brand" | "level"

interface SizeSpec {
  height: number
  bar: number
  gap: number
}

const SIZES: Record<SignalBarsSize, SizeSpec> = {
  sm: { height: 10, bar: 2, gap: 1 },
  md: { height: 14, bar: 3, gap: 2 },
  lg: { height: 20, bar: 4, gap: 2 },
}

/** The shortest bar is 40% of the tallest: a level of 1 must still read as a bar. */
const SHORTEST = 0.4

export interface SignalBarsProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** How many steps are filled. Clamped into `0…steps`. */
  value: number
  /** How many steps there are. Four is the phone-signal default; five is common for confidence. */
  steps?: number
  size?: SignalBarsSize
  tone?: SignalBarsTone
  /** The accessible name. Defaults to `"<value> of <steps>"`. */
  label?: string
  /** A visible text equivalent, rendered after the bars. */
  children?: ReactNode
}

/** `level` in three bands, so the token does not depend on how many steps there are. */
function levelTone(fraction: number): string {
  if (fraction <= 1 / 3) return "text-quebi-danger"
  if (fraction <= 2 / 3) return "text-quebi-warn"
  return "text-quebi-success"
}

export function SignalBars({
  value,
  steps = 4,
  size = "md",
  tone = "brand",
  label,
  children,
  className,
  ...props
}: SignalBarsProps) {
  const spec = SIZES[size]
  const total = Math.max(1, Math.round(steps))
  const filled = Math.min(total, Math.max(0, Math.round(value)))
  const fraction = filled / total

  // With a visible label beside it the graphic is a second copy of the same
  // fact, so it stops being announced rather than being announced twice.
  const hasVisibleText = children !== undefined && children !== null

  return (
    <span
      {...props}
      data-slot="signal-bars"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span
        data-slot="signal-bars-graphic"
        data-value={filled}
        data-steps={total}
        {...(hasVisibleText
          ? { "aria-hidden": true as const }
          : { role: "img", "aria-label": label ?? `${filled} of ${total}` })}
        className={cn("flex shrink-0 items-end", tone === "level" && levelTone(fraction))}
        style={{ height: spec.height, gap: spec.gap }}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            // A step is a fixed position on a fixed scale — there is nothing
            // else to key it by, and nothing about it moves.
            // biome-ignore lint/suspicious/noArrayIndexKey: the steps are positions on an absolute scale.
            key={index}
            data-slot="signal-bars-step"
            data-filled={index < filled ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-full bg-current transition-opacity duration-200 motion-reduce:transition-none",
              index < filled ? "opacity-100" : "opacity-20",
            )}
            style={{
              width: spec.bar,
              height: Math.round(
                spec.height * (SHORTEST + (1 - SHORTEST) * ((index + 1) / total)),
              ),
            }}
          />
        ))}
      </span>
      {hasVisibleText ? <span data-slot="signal-bars-label">{children}</span> : null}
    </span>
  )
}
