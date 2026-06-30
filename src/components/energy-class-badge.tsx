import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * EnergyClassBadge — EU energy-efficiency class chip (A–G).
 *
 * Renders the class letter on the official EU energy-label colour for that band
 * (A dark-green → G red). These per-band colours are *domain-semantic* (they ARE
 * the EU label scale, not quebi brand tokens) so they're kept as explicit values.
 * The chip itself is styled with quebi conventions (rounded-quebi-sm radius,
 * font-sans, neutral fallback on quebi tokens).
 *
 * The letter is always rendered as text, so colour is never the sole signal
 * (WCAG 1.4.1); pass a localised `aria-label` for a fuller screen-reader
 * description ("Energy efficiency class A"). Per-band text colour is fixed
 * (`text-white` / `text-black`) so each chip keeps ≥ 3:1 contrast against its
 * fill in any theme.
 *
 * Unknown / legacy values (e.g. "A+", "A+++") fall back to a neutral quebi chip
 * showing the raw text, so nothing is ever silently dropped.
 */
const KNOWN_CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const
type EnergyClassLetter = (typeof KNOWN_CLASSES)[number]

export const energyClassBadgeStyles = tv({
  base: "inline-flex items-center justify-center rounded-quebi-sm font-sans font-bold leading-none tracking-tight",
  variants: {
    // Official EU energy-label scale (dark-green A → red G). White text on the
    // dark ends (A, G), black on the bright middle bands keeps every chip ≥ 3:1
    // against its fill (large/graphical-object budget).
    band: {
      A: "bg-[#00843d] text-white",
      B: "bg-[#4caf30] text-black",
      C: "bg-[#bccf00] text-black",
      D: "bg-[#fff100] text-black",
      E: "bg-[#fabe00] text-black",
      F: "bg-[#ee7d00] text-black",
      G: "bg-[#e30613] text-white",
      unknown: "bg-white/[0.06] text-quebi-fg-muted border border-cyan-500/10",
    },
    size: {
      sm: "min-w-[20px] px-1.5 py-0.5 text-[12px]",
      md: "min-w-[28px] px-2 py-1 text-[15px]",
      lg: "min-w-[40px] px-2.5 py-1.5 text-[20px]",
    },
  },
  defaultVariants: { band: "unknown", size: "md" },
})

export interface EnergyClassBadgeProps
  extends Omit<React.ComponentProps<"span">, "children">,
    Pick<VariantProps<typeof energyClassBadgeStyles>, "size"> {
  /** Raw energy class value, e.g. "A", "b", "C". Whitespace/case tolerant. */
  energyClass: string
}

export function EnergyClassBadge({
  energyClass,
  size,
  className,
  ...props
}: EnergyClassBadgeProps) {
  const normalized = energyClass.trim().toUpperCase()
  const band: EnergyClassLetter | "unknown" = (KNOWN_CLASSES as readonly string[]).includes(
    normalized,
  )
    ? (normalized as EnergyClassLetter)
    : "unknown"
  // Recognised bands show the canonical single uppercase letter; unknown values
  // render verbatim (trimmed) so legacy "A+"-style data stays visible.
  const display = band === "unknown" ? energyClass.trim() : band

  return (
    <span {...props} className={cn(energyClassBadgeStyles({ band, size }), className)}>
      {display}
    </span>
  )
}
