"use client"

import { createContext, type ReactNode, useContext } from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/badge"
import { FormattedNumber } from "@/components/formatted-number"

/**
 * Stat — quebi design system
 *
 * One number with its label, and optionally what it did: a delta and a trend.
 * No card around it. A number does not need a box to be read, and a row of
 * boxes each holding one number is the most common way a dashboard spends its
 * ink on borders instead of data. `StatGroup` lays several side by side with a
 * hairline between them, and stacks them below `sm`, where the line would
 * divide nothing and the gap does the job.
 *
 * ## Markup
 *
 * A stat is a term and its description, so it renders as one: `StatGroup` is a
 * `<dl>`, each `Stat` is a `<div>` holding a `<dt>` (the label) and `<dd>`s
 * (the value, and the delta line). A `Stat` outside a group wraps itself in its
 * own `<dl>`, so the markup is valid either way. That is also why the lines
 * between stats are borders and not `Separator` elements: a `<dl>` may only
 * contain `<div>`, `<dt>` and `<dd>`, and a `role="separator"` between two
 * figures says nothing a screen reader user needs.
 *
 * ## Numbers
 *
 * Pass `value` a number and it goes through `FormattedNumber` with
 * `formatOptions`, so the locale comes from the nearest `I18nProvider` and the
 * prerender and the browser agree. Pass a node for anything else ("3 of 5",
 * a duration).
 *
 * ## Deltas
 *
 * `StatDelta` takes the change as a number, signs and formats it (a percentage
 * by default), picks the direction from the sign, and colours it by whether
 * that direction is good: up is green, unless `invert` says a rise is bad —
 * errors, latency, churn. The direction is also drawn as an arrow, so it is
 * never carried by colour alone.
 *
 * @example
 * <StatGroup aria-label="This week">
 *   <Stat label="Signups" value={1284} delta={<StatDelta value={0.12} />}
 *     trend={<Sparkline data={signups} />} />
 *   <Stat label="Checkout errors" value={17} delta={<StatDelta value={-0.4} invert />} />
 * </StatGroup>
 */

const InGroupContext = createContext(false)

export const statValueStyles = tv({
  base: "font-semibold text-quebi-fg tabular-nums leading-tight",
  variants: {
    size: {
      sm: "text-lg",
      md: "text-2xl",
      lg: "text-4xl tracking-tight",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface StatProps
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof statValueStyles> {
  /** What the number is. Rendered as the `<dt>`. */
  label: ReactNode
  /** The figure. A number is formatted through `FormattedNumber`; a node is rendered as is. */
  value: number | ReactNode
  /** `Intl.NumberFormat` options for a numeric `value` — a currency, a percentage, a unit. */
  formatOptions?: Intl.NumberFormatOptions
  /** How it changed: usually a `StatDelta`. */
  delta?: ReactNode
  /** How it got here: usually a `Sparkline`. */
  trend?: ReactNode
  /** What the delta is measured against, e.g. "vs last week". Muted, after the delta. */
  caption?: ReactNode
}

export function Stat({
  label,
  value,
  formatOptions,
  delta,
  trend,
  caption,
  size,
  className,
  ...props
}: StatProps) {
  const inGroup = useContext(InGroupContext)
  const hasFooter = delta != null || trend != null || caption != null

  const stat = (
    <div {...props} data-slot="stat" className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-xs text-quebi-fg-muted">{label}</dt>
      <dd className={statValueStyles({ size })}>
        {typeof value === "number" ? (
          <FormattedNumber value={value} options={formatOptions} />
        ) : (
          value
        )}
      </dd>
      {hasFooter && (
        <dd className="flex flex-wrap items-center gap-2 text-xs text-quebi-fg-subtle">
          {delta}
          {trend}
          {caption != null && <span>{caption}</span>}
        </dd>
      )}
    </div>
  )

  return inGroup ? stat : <dl>{stat}</dl>
}

export type StatDirection = "up" | "down" | "flat"

export interface StatDeltaProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The change. Its sign picks the direction; formatted as a signed percentage unless `options` says otherwise. */
  value: number
  /** `Intl.NumberFormat` options, merged over the percentage default. The sign is always shown. */
  options?: Intl.NumberFormatOptions
  /** A rise is bad: errors, latency, churn. Swaps the colours, not the arrow. */
  invert?: boolean
  /** Override the direction the sign implies — e.g. a rounded 0% that is really a small rise. */
  direction?: StatDirection
  /** Replace the formatted number with your own text. The arrow and colour still follow `value`. */
  children?: ReactNode
}

const ARROW_PATHS: Record<StatDirection, string> = {
  up: "M6 9.5V2.5M3 5.5l3-3 3 3",
  down: "M6 2.5v7M3 6.5l3 3 3-3",
  flat: "M2.5 6h7M6.5 3l3 3-3 3",
}

function directionOf(value: number): StatDirection {
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "flat"
}

export function StatDelta({
  value,
  options,
  invert = false,
  direction,
  children,
  ...props
}: StatDeltaProps) {
  const dir = direction ?? directionOf(value)
  const good = invert ? "down" : "up"
  const intent = dir === "flat" ? "neutral" : dir === good ? "success" : "danger"

  return (
    <Badge {...props} intent={intent} data-slot="stat-delta" data-direction={dir}>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="size-3 fill-none stroke-current"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={ARROW_PATHS[dir]} />
      </svg>
      {children ?? (
        <FormattedNumber
          value={value}
          options={{
            style: "percent",
            maximumFractionDigits: 1,
            ...options,
            signDisplay: "exceptZero",
          }}
        />
      )}
    </Badge>
  )
}

export interface StatGroupProps extends React.ComponentProps<"dl"> {}

/**
 * A row of stats with a hairline between them, stacked below `sm`. Name it with
 * `aria-label` when the page has no heading that already says what the numbers
 * are about.
 */
export function StatGroup({ className, children, ...props }: StatGroupProps) {
  return (
    <InGroupContext.Provider value={true}>
      <dl
        {...props}
        data-slot="stat-group"
        className={cn(
          "flex flex-col gap-4",
          "sm:flex-row sm:gap-6 sm:[&>*+*]:border-l sm:[&>*+*]:border-quebi-line/20 sm:[&>*+*]:pl-6",
          className,
        )}
      >
        {children}
      </dl>
    </InGroupContext.Provider>
  )
}
