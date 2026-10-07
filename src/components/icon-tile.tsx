import type { VariantProps } from "tailwind-variants"
import { cn, tv } from "@/lib/utils"

/**
 * IconTile — quebi design system
 *
 * A square box on the raised ground, at the control radius, that holds
 * exactly one icon, in ink: the leading glyph of a feature row,
 * an empty state, a stat card, or a list row. Non-interactive on purpose — a
 * tile that responds to a press is a `Button` with `size="sq-*"`, and a tile
 * with a label beside the glyph is a `Badge`.
 *
 * The intents are Badge's names (see `iconTileIntents`), so a call site can
 * hand the same intent to both. The box is Button's square scale, so a tile
 * lines up with the icon button next to it in the same row.
 *
 * Decorative by default: the tile is a plain `<span>` with no role, and the
 * icon inside is expected to carry `data-slot="icon"` (the tile sizes and tints
 * it) and its own `aria-hidden`. When the glyph *is* the meaning — a status
 * tile with no text beside it — say so at the call site with `role="img"` and
 * an `aria-label`.
 */

/**
 * Ink, per intent. Badge's key set, so an intent handed to one is valid for the
 * other, but not Badge's values: a tile holds a glyph rather than a label, so
 * it takes full ink (`text-quebi-fg`) where a tag takes the muted one.
 *
 * `brand`, `accent` and `info` are the plain tile — names kept for call sites,
 * no hue behind them. The three state intents are Badge's tints exactly (the
 * state token over a 10% wash of itself); `ai` is the slate action fill and
 * `outline` a hairline frame on no ground. Kept a copy rather than an import
 * because these components are distributed by copy-paste: an import would make
 * `shadcn add icon-tile` drag Badge into a project that asked for a box with an
 * icon in it. `tests/components/icon-tile.test.tsx` pins the shared half.
 */
export const iconTileIntents = {
  neutral: "border-transparent bg-quebi-raised text-quebi-fg",
  brand: "border-transparent bg-quebi-raised text-quebi-fg",
  accent: "border-transparent bg-quebi-raised text-quebi-fg",
  success: "border-transparent bg-quebi-success/10 text-quebi-success",
  warning: "border-transparent bg-quebi-warn/10 text-quebi-warn",
  danger: "border-transparent bg-quebi-danger/10 text-quebi-danger",
  info: "border-transparent bg-quebi-raised text-quebi-fg",
  ai: "border-transparent bg-quebi-action text-quebi-on-action",
  outline: "border-quebi-hairline bg-transparent text-quebi-fg",
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
    // `isCircle` rather than Avatar's `isSquare`: the control radius is the
    // default here, as it is for Button and Toggle (square inside
    // `quebi-editorial`).
    isCircle: {
      true: "rounded-full",
      false: "rounded-(--q-radius-control)",
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
