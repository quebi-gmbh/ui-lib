import { tv } from "tailwind-variants"

/**
 * EnergyClassBadge — EU energy-efficiency class chip (A–G).
 *
 * Renders the class letter on the official EU energy-label colour for that band
 * (A dark-green → G red, see the `--color-energy-*` tokens in styles.css). The
 * letter is always rendered as text, so colour is never the sole signal
 * (WCAG 1.4.1); pass a localised `aria-label` for a fuller screen-reader
 * description ("Energy efficiency class A"). Per-band text colour is fixed
 * (`text-white` / `text-black`, never the theme-flipping `text-ink-*`) so the
 * chip keeps its contrast in dark mode.
 *
 * Unknown / legacy values (e.g. "A+", "A+++") fall back to a neutral chip
 * showing the raw text, so nothing is ever silently dropped.
 */
const KNOWN_CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const
type EnergyClassLetter = (typeof KNOWN_CLASSES)[number]

const energyClassBadgeStyles = tv({
  base: "inline-flex items-center justify-center rounded-xs font-display font-bold leading-none tracking-tight",
  variants: {
    // White on the dark ends (A, G) and black on the bright middle bands keeps
    // every chip ≥ 3:1 against its fill (large/graphical-object budget).
    band: {
      A: "bg-energy-a text-white",
      B: "bg-energy-b text-black",
      C: "bg-energy-c text-black",
      D: "bg-energy-d text-black",
      E: "bg-energy-e text-black",
      F: "bg-energy-f text-black",
      G: "bg-energy-g text-white",
      unknown: "bg-ink-100 text-ink-700",
    },
    size: {
      sm: "min-w-[20px] px-1.5 py-0.5 text-[12px]",
      md: "min-w-[28px] px-2 py-1 text-[15px]",
      lg: "min-w-[40px] px-2.5 py-1.5 text-[20px]",
    },
  },
  defaultVariants: { band: "unknown", size: "md" },
})

export interface EnergyClassBadgeProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Raw energy class value, e.g. "A", "b", "C". Whitespace/case tolerant. */
  energyClass: string
  size?: "sm" | "md" | "lg"
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
    <span {...props} className={energyClassBadgeStyles({ band, size, className })}>
      {display}
    </span>
  )
}
