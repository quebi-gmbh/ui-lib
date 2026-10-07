"use client"

import {
  composeRenderProps,
  Label,
  type LabelProps,
  ProgressBar,
  type ProgressBarProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Leaderboard — quebi design system
 *
 * A ranked index list where each row is a react-aria ProgressBar whose value
 * relative to the leader is drawn as an ink rule along the row's foot, over
 * the hairline that separates it from the next. Actionable rows are raised and
 * shift right on hover, like any index row that goes somewhere. Compose from
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
      className={cn("text-balance font-display text-quebi-title text-quebi-fg", className)}
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
      className={cn(
        "flex max-h-96 list-none flex-col border-t border-quebi-rule",
        "*:border-b *:border-quebi-hairline",
        className,
      )}
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
        className={composeRenderProps(className, (resolved) =>
          cn(
            "relative overflow-hidden px-1 py-3 text-sm/6 text-quebi-fg outline-none",
            "transition-[padding,background-color] duration-300",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-quebi-focus",
            onAction ? "cursor-pointer hover:bg-quebi-raised hover:pl-3" : "cursor-default",
            "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            resolved,
          ),
        )}
        {...props}
      >
        {(values) => (
          <>
            <span className="relative z-[2] flex items-center justify-between">
              {typeof children === "function" ? children(values) : children}
            </span>
            <span
              data-slot="leaderboard-fill"
              className="absolute start-0 bottom-0 z-[1] h-0.5 bg-quebi-action forced-colors:bg-[CanvasText]"
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
      className={cn("flex items-center gap-x-3 font-display text-lg/6 font-light tracking-wide", className)}
      {...props}
    />
  )
}

export function LeaderboardEnd({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="leaderboard-end"
      className={cn("font-mono text-quebi-code tabular-nums text-quebi-fg-muted", className)}
      {...props}
    />
  )
}
