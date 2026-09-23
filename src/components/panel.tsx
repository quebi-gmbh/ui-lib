import { cn } from "@/lib/utils"

/**
 * Panel — quebi design system
 *
 * A tinted band that sets a region of the page apart: a fill and padding, and
 * nothing else. No border, no radius, no shadow — the tint is the whole
 * separation, which is what makes it the right surface for a page section and
 * the wrong one for a self-contained unit (that is a Card).
 *
 * It takes the width of its parent. Two ways to run it edge to edge:
 *
 * - Outside a `Container`, with a `Container` inside it, for a band across the
 *   whole window whose content still lines up with the column around it.
 * - `bleed` inside a `Container`: the band pulls out through the Container's
 *   gutter (`--container-padding`) and pads its content back in by the same
 *   amount, so the text inside starts where the text outside does. Outside a
 *   Container the variable is unset and `bleed` does nothing.
 *
 * `tone="brand"` is the mint tint, for the one band on a page that is asking
 * for something (a call to action, an upgrade). The muted tone is everything
 * else. The fill flips with the theme through `quebi-surface`: a white tint on
 * dark, an ink tint on light, so the band reads as recessed in both.
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** `muted` for grouping, `brand` for the single band that carries the ask. */
  tone?: "muted" | "brand"
  /** Pull the band through the enclosing Container's gutter to its edges. */
  bleed?: boolean
  /** The element to render. `section` when the band is a region with its own
   * heading, `aside` when it is tangential to the page. */
  as?: "div" | "section" | "aside"
}

export function Panel({
  className,
  tone = "muted",
  bleed = false,
  as: Element = "div",
  ...props
}: PanelProps) {
  return (
    <Element
      data-slot="panel"
      data-tone={tone}
      className={cn(
        "py-8 text-quebi-fg",
        tone === "brand" ? "bg-quebi-brand/[0.06]" : "bg-quebi-surface/[0.03]",
        bleed
          ? "-mx-(--container-padding) px-[var(--container-padding,calc(var(--spacing)*6))]"
          : "px-6",
        className,
      )}
      {...props}
    />
  )
}
