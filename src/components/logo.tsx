import { cn } from "@/lib/utils"

/**
 * Logo — quebi design system
 *
 * The quebi wordmark, or the round q on its own, in the right ink for the
 * theme: ink on Daylight, light on Cinematic.
 *
 * Both files are rendered and the theme picks one with CSS, rather than the
 * component reading the theme and choosing a `src`. The site is prerendered
 * with no theme known at build time, so a choice made in React would bake one
 * ink into the HTML and swap it after hydration — a flash of the wrong logo on
 * every dark page load. The selectors follow the `.dark` class the theme sets
 * on `<html>`, and a `.light` subtree inside a dark page wins back the ink one.
 *
 * Keep clear space of at least the height of the q around it. Never recolour,
 * outline, stretch or add effects to it, and never retype the wordmark in
 * Outfit — it is a drawing, not text.
 */

/** Intrinsic aspect ratios of the shipped files, so the width is reserved before they load. */
const ASPECT = { wordmark: 762 / 240, mark: 1 } as const

const DEFAULT_HEIGHT = { wordmark: 20, mark: 36 } as const

const DEFAULT_SRC = {
  wordmark: { ink: "/brand/quebi-wordmark-ink.png", light: "/brand/quebi-wordmark-light.png" },
  mark: { ink: "/brand/quebi-mark-ink.png", light: "/brand/quebi-mark-light.png" },
} as const

export interface LogoProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** `wordmark` (default) for navigation and footers; `mark`, the round q, where the name is already said. */
  variant?: "wordmark" | "mark"
  /**
   * Rendered height in px. Defaults to 20 for the wordmark (a nav bar) and 36
   * for the mark; 32 suits a landing page's top-left nav. Keep the mark at 36
   * or more.
   */
  height?: number
  /** Your own hosted copy of the ink (dark-on-light) file. */
  srcInk?: string
  /** Your own hosted copy of the light (light-on-dark) file. */
  srcLight?: string
  /** Accessible name. Defaults to "quebi". */
  label?: string
}

export function Logo({
  variant = "wordmark",
  height = DEFAULT_HEIGHT[variant],
  srcInk = DEFAULT_SRC[variant].ink,
  srcLight = DEFAULT_SRC[variant].light,
  label = "quebi",
  className,
  ...props
}: LogoProps) {
  const width = Math.round(height * ASPECT[variant])
  return (
    <span
      data-slot="logo"
      data-variant={variant}
      role="img"
      aria-label={label}
      className={cn("inline-block shrink-0 leading-none", className)}
      {...props}
    >
      <img
        data-ink="ink"
        src={srcInk}
        alt=""
        width={width}
        height={height}
        draggable={false}
        className="block max-w-none [.dark_&]:hidden [.dark_.light_&]:block"
      />
      <img
        data-ink="light"
        src={srcLight}
        alt=""
        width={width}
        height={height}
        draggable={false}
        className="hidden max-w-none [.dark_&]:block [.dark_.light_&]:hidden"
      />
    </span>
  )
}
