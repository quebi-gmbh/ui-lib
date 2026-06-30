import { cn } from "@/lib/utils"

/**
 * Skeleton — quebi design system
 *
 * A pulsing placeholder for content that is still loading. Compose several
 * skeletons to mirror the shape of the eventual content. The default fill
 * uses a faint cyan tint so it reads as "on-brand surface noise"; `soft`
 * drops it even lower for nested or secondary placeholders.
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
        "shrink-0 animate-pulse rounded-quebi-sm",
        soft ? "bg-cyan-500/5" : "bg-cyan-500/10",
        className,
      )}
      {...props}
    />
  )
}
