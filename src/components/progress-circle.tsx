"use client"

import { ProgressBar, type ProgressBarProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ProgressCircle — quebi design system
 *
 * Built on react-aria-components. A circular progress indicator: a faint
 * cyan track with a brand-teal ring that fills clockwise as the value grows.
 * Pass `isIndeterminate` for a continuous spinning state (useful as a button
 * or inline loading glyph). Inherits its size from the surrounding font size,
 * or override with a `size-*` class.
 */
interface ProgressCircleProps extends Omit<ProgressBarProps, "className"> {
  className?: string
  ref?: React.RefObject<HTMLDivElement>
}

function ProgressCircle({ className, ref, ...props }: ProgressCircleProps) {
  const c = "50%"
  const r = "calc(50% - 2px)"
  return (
    <ProgressBar {...props} ref={ref}>
      {({ percentage, isIndeterminate }) => (
        <svg
          aria-hidden="true"
          className={cn("size-4 shrink-0", className)}
          viewBox="0 0 24 24"
          fill="none"
          data-slot="icon"
        >
          <circle
            cx={c}
            cy={c}
            r={r}
            strokeWidth={3}
            className="stroke-cyan-500/10"
          />
          {!isIndeterminate ? (
            <circle
              cx={c}
              cy={c}
              r={r}
              strokeWidth={3}
              pathLength={100}
              strokeDasharray="100 200"
              strokeDashoffset={100 - (percentage ?? 0)}
              strokeLinecap="round"
              transform="rotate(-90)"
              className="origin-center stroke-quebi-brand transition-[stroke-dashoffset] duration-200"
            />
          ) : (
            <circle
              cx={c}
              cy={c}
              r={r}
              strokeWidth={3}
              pathLength={100}
              strokeDasharray="100 200"
              strokeDashoffset={100 - 30}
              strokeLinecap="round"
              className="origin-center stroke-quebi-brand animate-[spin_1s_cubic-bezier(0.4,0,0.2,1)_infinite]"
            />
          )}
        </svg>
      )}
    </ProgressBar>
  )
}

export type { ProgressCircleProps }
export { ProgressCircle }
