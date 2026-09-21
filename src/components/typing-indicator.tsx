import { cn } from "@/lib/utils"

/**
 * TypingIndicator — quebi design system
 *
 * Three staggered dots: *a reply is being composed*. That is a narrower claim
 * than "a process is running", and it is the reason this is its own component
 * rather than a shape on `ActivityPulse` — a reply has no throughput to report
 * and no evidence to show, so this is the one indicator in the family that is
 * pure decoration with no data feed behind it. Reach for `ActivityPulse` the
 * moment you have a counter worth drawing.
 *
 * The motion is CSS (`animate-bounce` with a per-dot delay), not a timer, so
 * the component renders and re-renders nothing. Under `motion-reduce` the
 * animation is dropped and the three dots stay put — still three dots, which
 * still says "something is coming", rather than nothing at all.
 *
 * `label` is announced once through an `sr-only` `role="status"` region. The
 * dots themselves are `aria-hidden`; a 3Hz bounce has nothing to announce.
 *
 * @example
 * <TypingIndicator label="Claude is replying" />
 * <TypingIndicator size="lg" className="text-quebi-brand-text" />
 */

export type TypingIndicatorSize = "sm" | "md" | "lg"

const SIZES: Record<TypingIndicatorSize, { dot: string; gap: string }> = {
  sm: { dot: "size-1", gap: "gap-0.5" },
  md: { dot: "size-1.5", gap: "gap-1" },
  lg: { dot: "size-2", gap: "gap-1" },
}

/** Staggered by a third of the cycle, so the three dots read as one travelling wave. */
const DELAYS = ["0ms", "160ms", "320ms"]

export interface TypingIndicatorProps extends Omit<React.ComponentProps<"span">, "children"> {
  size?: TypingIndicatorSize
  /** What a screen reader hears. Rendered once, politely. */
  label?: string
}

export function TypingIndicator({
  size = "md",
  label = "Composing a reply",
  className,
  ...props
}: TypingIndicatorProps) {
  const spec = SIZES[size]

  return (
    <span
      {...props}
      data-slot="typing-indicator"
      className={cn("inline-flex items-center", className)}
    >
      <span aria-hidden="true" className={cn("inline-flex items-center", spec.gap)}>
        {DELAYS.map((delay) => (
          <span
            key={delay}
            data-slot="typing-indicator-dot"
            className={cn(
              "shrink-0 animate-bounce rounded-full bg-current opacity-70 motion-reduce:animate-none",
              spec.dot,
            )}
            style={{ animationDelay: delay }}
          />
        ))}
      </span>
      {label ? (
        <span role="status" className="sr-only">
          {label}
        </span>
      ) : null}
    </span>
  )
}
