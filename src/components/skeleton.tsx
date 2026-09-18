import { cn } from "@/lib/utils"

/**
 * Skeleton — quebi design system
 *
 * A pulsing placeholder for content that is still loading. Compose several
 * skeletons to mirror the shape of the eventual content.
 *
 * The fill is `quebi-line` — cyan on dark, ink on light — so the bar tints in
 * the direction its own theme tints everything else. It used to be a literal
 * `bg-cyan-500/10`, a dark-theme value that reached 1.09:1 on the light card
 * (task #139). `soft` drops it further for nested or secondary placeholders.
 *
 * The alpha is the Separator's: a Skeleton has at least a divider's claim on
 * being visible, and unlike a divider it *is* the component — there is no
 * text, border or glyph carrying the shape if the fill fails. Which is also
 * why the pulse is `quebi-pulse` rather than Tailwind's `animate-pulse`: that
 * one troughs at 0.5 opacity, halving a fill this faint every two seconds.
 */
export interface SkeletonProps extends React.ComponentProps<"div"> {
  /** Use a fainter fill for nested or secondary placeholders. */
  soft?: boolean
}

export function Skeleton({ ref, soft = false, className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      ref={ref}
      className={cn(
        "shrink-0 quebi-pulse rounded-quebi-sm",
        soft ? "bg-quebi-line/12" : "bg-quebi-line/20",
        className,
      )}
      {...props}
    />
  )
}
