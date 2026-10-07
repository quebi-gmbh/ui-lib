import type { VariantProps } from "tailwind-variants"
import { cn, tv } from "@/lib/utils"

/**
 * The design's Tag, per intent: a hairline-edged mark in the subtle ink.
 *
 * There is no hue here. `brand`, `accent` and `info` are the plain tag — they
 * survive as names so call sites keep compiling, but emphasis in this system
 * is size, weight or ink, not colour; the signal is state, never a tag. The
 * three state intents are the only tints: the state token as text over a 10%
 * wash of itself. `ai` is the one fill, the slate action, and `outline` is the
 * plain tag under its own name.
 *
 * Exported because `iconTileIntents` in `icon-tile.tsx` shares the key set and
 * the three state tints, pinned by `tests/components/icon-tile.test.tsx`.
 */
export const badgeIntents = {
  neutral: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
  brand: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
  accent: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
  success: "border-transparent bg-quebi-success/10 text-quebi-success",
  warning: "border-transparent bg-quebi-warn/10 text-quebi-warn",
  danger: "border-transparent bg-quebi-danger/10 text-quebi-danger",
  info: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
  ai: "border-transparent bg-quebi-action text-quebi-on-action",
  outline: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
}

/**
 * Badge — quebi design system
 *
 * The Tag: mono uppercase at the label size (`text-quebi-label`) in a 1px
 * box at the mark radius. The border is always present (transparent on the
 * filled intents) so every badge in a row is the same size.
 *
 * Intents: neutral (default), brand, accent, success, warning, danger, info,
 * ai, outline. A badge with no text, holding only an icon, is an `IconTile`.
 */
export const badgeStyles = tv({
  base: [
    "inline-flex items-center gap-1.5",
    "font-mono text-quebi-label uppercase whitespace-nowrap",
    "rounded-(--q-radius-mark) border px-1.5 py-0.5",
  ],
  variants: {
    intent: badgeIntents,
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
 * Prepends a 6px dot — use for live-state indicators ("live", "draft",
 * "overdue"). The dot inherits the badge's text colour.
 */
export function BadgeDot() {
  return <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
}
