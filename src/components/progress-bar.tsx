"use client"

import { createContext, use } from "react"
import {
  ProgressBar as ProgressBarPrimitive,
  type ProgressBarProps,
  type ProgressBarRenderProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ProgressBar — quebi design system
 *
 * Built on react-aria-components. A slim track tinted cyan-500/10 with a
 * brand-teal fill that animates its width. Supports determinate and
 * indeterminate states, plus an optional header with label and value.
 */
const ProgressBarContext = createContext<ProgressBarRenderProps | null>(null)

export function ProgressBar({ className, children, ...props }: ProgressBarProps) {
  return (
    <ProgressBarPrimitive
      data-slot="control"
      className={cn(
        "flex w-full flex-col gap-2",
        "*:data-[slot=progress-bar-header]:font-medium",
        className,
      )}
      {...props}
    >
      {(values) => (
        <ProgressBarContext value={values}>
          {typeof children === "function" ? children(values) : children}
        </ProgressBarContext>
      )}
    </ProgressBarPrimitive>
  )
}

export function ProgressBarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-bar-header"
      className={cn("flex items-center justify-between text-sm text-white", className)}
      {...props}
    />
  )
}

export function ProgressBarValue({
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children">) {
  const ctx = use(ProgressBarContext)
  if (!ctx) throw new Error("ProgressBarValue must be used within a ProgressBar")
  const { valueText } = ctx
  return (
    <span
      data-slot="progress-bar-value"
      className={cn("text-sm text-quebi-fg-muted tabular-nums", className)}
      {...props}
    >
      {valueText}
    </span>
  )
}

export function ProgressBarTrack({ className, ref, ...props }: React.ComponentProps<"div">) {
  const ctx = use(ProgressBarContext)
  if (!ctx) throw new Error("ProgressBarTrack must be used within a ProgressBar")
  const { isIndeterminate, percentage } = ctx
  return (
    <span data-slot="progress-bar-track" className="relative block w-full">
      <style>{`
        @keyframes quebi-progress-slide {
          0% { inset-inline-start: -40% }
          100% { inset-inline-start: 100% }
        }
      `}</style>
      <div
        ref={ref}
        data-slot="progress-container"
        className={cn(
          "relative h-1.5 w-full min-w-52 overflow-hidden rounded-full border border-cyan-500/10 bg-cyan-500/10 will-change-transform",
          className,
        )}
        {...props}
      >
        {!isIndeterminate ? (
          <div
            data-slot="progress-content"
            className="absolute start-0 top-0 h-full rounded-full bg-quebi-brand transition-[width] duration-200 ease-linear will-change-[width] motion-reduce:transition-none forced-colors:bg-[Highlight]"
            style={{ width: `${percentage}%` }}
          />
        ) : (
          <div
            data-slot="progress-content"
            className="absolute top-0 h-full w-2/5 animate-[quebi-progress-slide_1500ms_ease-in-out_infinite] rounded-full bg-quebi-brand forced-colors:bg-[Highlight]"
          />
        )}
      </div>
    </span>
  )
}
