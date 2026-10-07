"use client"

import { createContext, use } from "react"
import {
  composeRenderProps,
  Meter as MeterPrimitive,
  type MeterProps as MeterPrimitiveProps,
  type MeterRenderProps as MeterPrimitiveRenderProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Meter — quebi design system
 *
 * Built on react-aria-components. A labelled progress-style bar for a known
 * range (storage used, quota, score). A thin square track in `hairline`; the
 * fill is `signal` and shifts to the warn token from 70% and the danger
 * token from 90%, or you can pin an explicit color. Composed from Meter,
 * MeterHeader, MeterValue, and MeterTrack.
 */

interface MeterRenderProps extends MeterPrimitiveRenderProps {
  color?: string
}

const MeterContext = createContext<MeterRenderProps | null>(null)

interface MeterProps extends MeterPrimitiveProps, Pick<MeterRenderProps, "color"> {}

export function Meter({ className, children, color, ...props }: MeterProps) {
  return (
    <MeterPrimitive
      data-slot="meter"
      {...props}
      className={composeRenderProps(className, (resolved) =>
        cn(
          "w-full",
          "[&>[data-slot=meter-header]+[data-slot=meter-track]]:mt-2",
          "[&>[data-slot=meter-header]+[slot='description']]:mt-1",
          "[&>[slot='description']+[data-slot=meter-track]]:mt-2",
          "[&>[data-slot=meter-track]+[slot=description]]:mt-2",
          "[&>[data-slot=meter-track]+[slot=errorMessage]]:mt-2",
          "*:data-[slot=meter-header]:font-medium",
          resolved,
        ),
      )}
    >
      {(values) => (
        <MeterContext value={{ ...values, color }}>
          {typeof children === "function" ? children(values) : children}
        </MeterContext>
      )}
    </MeterPrimitive>
  )
}

export function MeterHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="meter-header"
      className={cn("flex items-center justify-between text-sm text-quebi-fg", className)}
      {...props}
    />
  )
}

export function MeterValue({
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children">) {
  const ctx = use(MeterContext)
  if (!ctx) throw new Error("MeterValue must be used within a Meter")
  const { valueText } = ctx
  return (
    <span
      data-slot="meter-value"
      className={cn("font-mono text-quebi-caption text-quebi-fg-subtle tabular-nums", className)}
      {...props}
    >
      {valueText}
    </span>
  )
}

export function MeterTrack({ className, ...props }: React.ComponentProps<"div">) {
  const ctx = use(MeterContext)
  if (!ctx) throw new Error("MeterTrack must be used within a Meter")
  const { percentage, color } = ctx
  return (
    <div
      data-slot="meter-track"
      className={cn(
        "relative h-1 w-full overflow-hidden bg-quebi-hairline",
        className,
      )}
      {...props}
    >
      <div
        data-slot="meter-fill"
        className="absolute start-0 top-0 h-full transition-[width] duration-200 ease-linear will-change-[width] motion-reduce:transition-none forced-colors:bg-[Highlight]"
        style={{ width: `${percentage}%`, backgroundColor: color ?? getMeterColor(percentage) }}
      />
    </div>
  )
}

function getMeterColor(value: number): string {
  if (value < 70) return "var(--color-quebi-signal)"
  if (value < 90) return "var(--color-quebi-warn)"
  return "var(--color-quebi-danger)"
}
