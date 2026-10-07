import { cn } from "@/lib/utils"

/**
 * Skeleton — quebi design system
 *
 * A pulsing placeholder for content that is still loading. Compose several
 * skeletons to mirror the shape of the eventual content.
 *
 * The fill is `raised` — the ground of a hovered row, an ink tint in both
 * themes — and the bar is square, like the content it stands in for. `soft`
 * drops it further for nested or secondary placeholders.
 *
 * A Skeleton *is* the component — there is no text, border or glyph carrying
 * the shape if the fill fails — which is why the pulse is `quebi-pulse` rather
 * than Tailwind's `animate-pulse`: that one troughs at 0.5 opacity, halving a
 * fill this faint every two seconds.
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
        "shrink-0 quebi-pulse",
        soft ? "bg-quebi-raised/60" : "bg-quebi-raised",
        className,
      )}
      {...props}
    />
  )
}
