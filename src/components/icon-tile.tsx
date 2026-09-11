import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * IconTile — quebi design system
 *
 * A tinted box that holds exactly one icon: the leading glyph of a feature row,
 * an empty state, a stat card, or a list row. Non-interactive on purpose — a
 * tile that responds to a press is a `Button` with `size="sq-*"`, and a tile
 * with a label beside the glyph is a `Badge`.
 *
 * The tint is Badge's, value for value (see `iconTileIntents`), so a tile and a
 * badge on the same surface read as one family. The box is Button's square
 * scale, so a tile lines up with the icon button next to it in the same row.
 *
 * Decorative by default: the tile is a plain `<span>` with no role, and the
 * icon inside is expected to carry `data-slot="icon"` (the tile sizes and tints
 * it) and its own `aria-hidden`. When the glyph *is* the meaning — a status
 * tile with no text beside it — say so at the call site with `role="img"` and
 * an `aria-label`.
 */

/**
 * The quebi tint scale: a low-opacity fill, a matching saturated foreground and
 * a hairline border.
 *
 * A verbatim copy of `badgeIntents` in `badge.tsx`, kept a copy rather than an
 * import because these components are distributed by copy-paste: an import
 * would make `shadcn add icon-tile` drag Badge into a project that asked for a
 * box with an icon in it, for nine strings. That is the trade this library has
 * already made twice — `select.tsx` spells out Input's size scale rather than
 * gaining Input as a registry dependency "for three strings", and toggle.tsx
 * spells out Button's.
 *
 * The difference is that a comment is the only thing holding those two in step.
 * Here the copy is pinned: `tests/components/icon-tile.test.tsx` asserts the two
 * records are equal, so a tint that changes in one file and not the other fails
 * the suite instead of drifting for a year. Change both, or change neither.
 */
export const iconTileIntents = {
  neutral: "bg-quebi-surface/[0.06] border-quebi-surface/10 text-quebi-fg-muted",
  brand: "bg-quebi-brand/10 border-quebi-brand/20 text-quebi-brand",
  accent: "bg-purple-500/10 border-purple-500/20 text-quebi-accent",
  success: "bg-emerald-500/10 border-emerald-500/20 text-quebi-success",
  warning: "bg-amber-500/10 border-amber-500/20 text-quebi-warn",
  danger: "bg-red-500/10 border-red-500/20 text-quebi-danger",
  info: "bg-cyan-500/10 border-quebi-line/20 text-quebi-info",
  ai: "border-transparent bg-gradient-to-r from-quebi-brand to-purple-500 text-quebi-on-brand shadow-quebi-glow",
  outline: "bg-transparent border-quebi-line/20 text-quebi-fg-muted",
}

export const iconTileStyles = tv({
  base: [
    "inline-grid place-content-center shrink-0 select-none align-middle border",
    "*:data-[slot=icon]:shrink-0",
  ],
  variants: {
    intent: iconTileIntents,
    size: {
      // `size-*` is border-box, so these numbers are the square button scale
      // (button.tsx `sq-*`) exactly: a tile sits at the same height as the icon
      // button beside it without either one being nudged.
      xs: "size-7.5 *:data-[slot=icon]:size-3.5",
      sm: "size-9.5 *:data-[slot=icon]:size-4",
      md: "size-11.5 *:data-[slot=icon]:size-5",
      lg: "size-13.5 *:data-[slot=icon]:size-6",
      // Below the button scale, because a tile is not a hit target and nothing
      // here has to be 30px square to be pressable. This is the inline
      // indicator size — the sort affordance in a table column header — where
      // the glyph fills the box rather than sitting in it.
      "2xs": "size-4.5 *:data-[slot=icon]:size-3.5",
    },
    // Radius belongs to the variant, not `base` — see button.tsx. `isCircle`
    // rather than Avatar's `isSquare`: square is the default here, as it is for
    // Button and Toggle, and a tile lines those up more often than it lines up
    // an avatar.
    isCircle: {
      true: "rounded-full",
      false: "rounded-quebi-sm",
    },
  },
  defaultVariants: {
    intent: "neutral",
    size: "md",
    isCircle: false,
  },
})

export interface IconTileProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof iconTileStyles> {}

export function IconTile({ intent, size, isCircle, className, children, ...props }: IconTileProps) {
  return (
    <span
      data-slot="icon-tile"
      {...props}
      className={cn(iconTileStyles({ intent, size, isCircle }), className)}
    >
      {children}
    </span>
  )
}
