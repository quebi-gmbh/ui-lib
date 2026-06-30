import { tv } from "tailwind-variants"

/**
 * Badge — Cellestial Design System
 *
 * Spec (cellestial-ds/components.css):
 *   .badge           → ink-100 bg, ink-700 text (neutral)
 *   .badge--brand    → brand-100 bg, brand-700 text
 *   .badge--accent   → accent-100 bg, accent-700 text
 *   .badge--success  → success-100 bg, success-600 text
 *   .badge--warning  → warning-100 bg, warning-600 text
 *   .badge--danger   → danger-100 bg, danger-600 text
 *   .badge--ai       → signature gradient, white text (AI match, reserve for AI)
 *   .badge--dot      → colored dot glyph prefix (for live-state indicators)
 *
 * All variants: 12px font, 600 weight, pill-shaped, `px-2 py-[3px]`.
 */
export const badgeStyles = tv({
  base: "inline-flex items-center gap-[6px] text-[12px] font-semibold rounded-pill px-2 py-[3px] border border-transparent",
  variants: {
    intent: {
      neutral: "bg-ink-100 text-ink-700",
      brand: "bg-brand-100 text-brand-700",
      accent: "bg-accent-100 text-accent-700",
      success: "bg-success-100 text-success-600",
      warning: "bg-warning-100 text-warning-600",
      danger: "bg-danger-100 text-danger-600",
      info: "bg-info-100 text-info-500",
      ai: "bg-gradient-brand text-white border-0",
      outline: "bg-transparent border-ink-200 text-ink-700",
      /** Alias kept for back-compat with the legacy oklch-based Badge API. */
      primary: "bg-brand-100 text-brand-700",
      secondary: "bg-ink-100 text-ink-700",
    },
    isCircle: {
      true: "rounded-pill",
      false: "rounded-pill",
    },
  },
  defaultVariants: {
    intent: "neutral",
    isCircle: true,
  },
})

export interface BadgeProps extends React.ComponentProps<"span"> {
  intent?:
    | "neutral"
    | "brand"
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "ai"
    | "outline"
    /** @deprecated use `intent="brand"` */
    | "primary"
    /** @deprecated use `intent="neutral"` */
    | "secondary"
  isCircle?: boolean
}

export function Badge({ intent, isCircle, className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={badgeStyles({ intent, isCircle, className })}>
      {children}
    </span>
  )
}

/**
 * Prepends a colored dot glyph — use for live-state indicators ("Live",
 * "Overdue", etc.). Dot inherits the badge's text color.
 */
export function BadgeDot() {
  return <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
}
