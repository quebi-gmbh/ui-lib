"use client"

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  composeRenderProps,
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { cn, tv } from "@/lib/utils"

/**
 * Button — quebi design system
 *
 * Intents: primary (solid ink), secondary (raised ground), outline (ruled),
 * ghost (no box at rest), danger.
 * Sizes: xs / sm / md (default) / lg / xl, plus square icon-only (sq-*).
 *
 * Square, ruled and flat: no radius unless `isCircle`, a 1px border on every
 * intent (transparent where the intent has no edge, so every intent is the same
 * height), and no shadow — a button sits in the page flow, and depth there
 * comes from rules. Hover changes the fill and nothing else.
 */
export const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-medium whitespace-nowrap select-none cursor-pointer",
    "border border-solid",
    // Named properties, not `transition-all`: `all` would also animate layout
    // and the focus ring. These are what the intents and `disabled:`/`pending:`
    // actually move.
    "transition-[background-color,border-color,color,opacity] duration-150 ease-out",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-3 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-45 disabled:cursor-not-allowed",
    "pending:opacity-70 pending:cursor-wait",
    // react-aria slot conventions — icons & loaders inherit current color
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
    "*:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center",
  ],
  variants: {
    intent: {
      // The design's solid button. Hover steps the ink toward the body colour
      // (gray-800 on Daylight, gray-300 on Cinematic); the label stays above
      // 4.5:1 at both ends.
      primary:
        "bg-quebi-action border-quebi-action text-quebi-on-action hover:bg-quebi-action-hover hover:border-quebi-action-hover",
      secondary: "bg-quebi-raised border-transparent text-quebi-fg hover:bg-quebi-pressed",
      // The design's outline button: transparent, drawn by a line-strong rule.
      outline: "bg-transparent border-quebi-rule text-quebi-fg hover:bg-quebi-raised",
      ghost:
        "bg-transparent border-transparent text-quebi-fg-muted hover:bg-quebi-raised hover:text-quebi-fg",
      // The label is the page ground, not white: `--q-danger` is red-700 on
      // Daylight and red-400 on Cinematic, and only the ground flips with it —
      // white on red-400 is 2.8:1, ink on it is 7:1. Hover fades rather than
      // shifting hue, so there is no second red to keep in contrast.
      danger: "bg-quebi-danger border-quebi-danger text-quebi-bg hover:opacity-90",
    },
    size: {
      xs: ["text-xs px-2.5 py-1.5", "*:data-[slot=icon]:size-3 *:data-[slot=loader]:size-3"],
      sm: ["text-sm px-3.5 py-2", "*:data-[slot=icon]:size-3.5 *:data-[slot=loader]:size-3.5"],
      // The design's button: 14px Inter 500, 20px sides. Its 13px vertical
      // padding is on a line-height of 1; here the line box is 20px, so 12px
      // padding gives the same optical weight with room for descenders.
      md: ["text-sm px-5 py-3", "*:data-[slot=icon]:size-4 *:data-[slot=loader]:size-4"],
      lg: ["text-base px-6 py-3.5", "*:data-[slot=icon]:size-5 *:data-[slot=loader]:size-5"],
      xl: ["text-lg px-8 py-4", "*:data-[slot=icon]:size-6 *:data-[slot=loader]:size-6"],
      // Square / icon-only. `size-*` is border-box, so a square matches its
      // text-sized sibling only if the number includes the 1px border on each
      // side: xs is line-height 16 + py-1.5 12 + 2 = 30px, sm 20 + 16 + 2 = 38,
      // md 20 + 24 + 2 = 46, lg 24 + 28 + 2 = 54.
      "sq-xs": "size-7.5 p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-9.5 p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-11.5 p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-13.5 p-0 *:data-[slot=icon]:size-6",
    },
    // The radius lives here, not in `base`, so `rounded-full` never has to win
    // a tailwind-merge against a base radius: mutually exclusive branches never
    // rely on the merge at all.
    isCircle: {
      true: "rounded-full",
      false: "rounded-none",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "md",
    isCircle: false,
  },
})

export interface ButtonProps extends ButtonPrimitiveProps, VariantProps<typeof buttonStyles> {
  ref?: React.Ref<HTMLButtonElement>
}

export function Button({ className, intent, size, isCircle, ref, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      {...props}
      className={composeRenderProps(className, (resolved) =>
        cn(buttonStyles({ intent, size, isCircle }), resolved),
      )}
    />
  )
}
