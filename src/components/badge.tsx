import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * Badge — quebi design system
 *
 * Pill-shaped indicator. Every intent pairs a tinted, low-opacity background
 * with a matching saturated text color and a hairline border — the quebi
 * signature. Brand teal is reserved for feature highlights; the `ai` intent
 * uses the teal→purple gradient and should stay limited to AI surfaces.
 *
 * Intents: neutral (default), brand, accent, success, warning, danger, info,
 * ai, outline.
 */
export const badgeStyles = tv({
  base: [
    "inline-flex items-center gap-1.5",
    "font-sans text-xs font-semibold leading-none whitespace-nowrap",
    "rounded-full px-2.5 py-1 border",
  ],
  variants: {
    intent: {
      neutral: "bg-white/[0.06] border-white/10 text-quebi-fg-muted",
      brand: "bg-quebi-brand/10 border-quebi-brand/20 text-quebi-brand",
      accent: "bg-purple-500/10 border-purple-500/20 text-purple-300",
      success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      danger: "bg-red-500/10 border-red-500/20 text-red-400",
      info: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
      ai: "border-transparent bg-gradient-to-r from-quebi-brand to-purple-500 text-quebi-bg shadow-quebi-glow",
      outline: "bg-transparent border-cyan-500/20 text-quebi-fg-muted",
    },
  },
  defaultVariants: {
    intent: "neutral",
  },
})

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeStyles> {}

export function Badge({ intent, className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={cn(badgeStyles({ intent }), className)}>
      {children}
    </span>
  )
}

/**
 * Prepends a 6px colored dot glyph — use for live-state indicators ("Live",
 * "Draft", "Overdue", etc.). The dot inherits the badge's text color.
 */
export function BadgeDot() {
  return <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
}
