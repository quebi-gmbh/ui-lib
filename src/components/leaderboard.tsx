"use client"

import { Label, type LabelProps, ProgressBar, type ProgressBarProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Leaderboard — quebi design system
 *
 * A compact ranked list where each row is a react-aria ProgressBar whose
 * fill encodes its value relative to the leader. The fill is a translucent
 * brand-teal track that brightens on hover for actionable rows. Compose from
 * Leaderboard, LeaderboardHeader, LeaderboardTitle, LeaderboardAction,
 * LeaderboardContent, LeaderboardItem, LeaderboardStart, and LeaderboardEnd.
 */
export function Leaderboard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="leaderboard"
      className={cn("flex flex-col gap-y-4", className)}
      {...props}
    />
  )
}

export function LeaderboardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="leaderboard-header"
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 has-data-[slot=leaderboard-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  )
}

export function LeaderboardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="leaderboard-title"
      className={cn("text-balance font-semibold text-base/6 text-white", className)}
      {...props}
    />
  )
}

export function LeaderboardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="leaderboard-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

export function LeaderboardContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="leaderboard-content"
      className={cn("flex max-h-96 list-none flex-col gap-y-1", className)}
      {...props}
    />
  )
}

interface LeaderboardItemProps extends ProgressBarProps {
  onAction?: () => void
}

export function LeaderboardItem({
  minValue = 0,
  className,
  children,
  onAction,
  ...props
}: LeaderboardItemProps) {
  return (
    <li className="group" data-slot="leaderboard-item">
      <ProgressBar
        onClick={onAction}
        minValue={minValue}
        className={cn(
          "relative overflow-hidden rounded-quebi-sm px-2 py-1.5 text-sm/6 text-white outline-none",
          "transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
          onAction ? "cursor-pointer hover:bg-white/[0.02]" : "cursor-default",
          "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      >
        {(values) => (
          <>
            <span className="relative z-[2] flex items-center justify-between font-medium">
              {typeof children === "function" ? children(values) : children}
            </span>
            <span
              data-slot="leaderboard-fill"
              className={cn(
                "absolute inset-y-0 start-0 z-[1] rounded-e-quebi-sm bg-quebi-brand/15 transition-colors duration-150",
                onAction ? "group-hover:bg-quebi-brand/25" : "",
              )}
              style={{ width: `${values.percentage}%` }}
            />
          </>
        )}
      </ProgressBar>
    </li>
  )
}

export function LeaderboardStart({ className, ...props }: LabelProps) {
  return (
    <Label
      data-slot="leaderboard-start"
      className={cn("flex items-center gap-x-2", className)}
      {...props}
    />
  )
}

export function LeaderboardEnd({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="leaderboard-end"
      className={cn("tabular-nums text-quebi-fg-muted", className)}
      {...props}
    />
  )
}
