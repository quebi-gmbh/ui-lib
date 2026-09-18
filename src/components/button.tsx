"use client"

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  composeRenderProps,
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * Button — quebi design system
 *
 * Intents: primary (teal CTA), secondary (solid white-on-dark), outline,
 * ghost, accent (purple), danger (red).
 * Sizes: xs / sm / md (default) / lg / xl, plus square icon-only (sq-*).
 *
 * Depth comes from shadow-quebi-glow, never a hand-rolled shadow. Hover lifts with a
 * subtle scale; the brand teal is reserved for the primary CTA.
 */
export const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-semibold whitespace-nowrap select-none cursor-pointer",
    "border border-solid",
    "transition-all duration-200 ease-out",
    "hover:scale-[1.02] active:scale-100",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    "pending:opacity-70 pending:cursor-wait",
    // react-aria slot conventions — icons & loaders inherit current color
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
    "*:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center",
  ],
  variants: {
    intent: {
      // The mint fill's edge is drawn in the *mark* token, not the fill token
      // (task #145): mint on the light page is 1.74:1, so `border-quebi-brand`
      // gave the pill no boundary against the page at all, and the hover border
      // made it fainter still. `--q-brand-mark` is teal-600 on light (3.45:1,
      // WCAG 1.4.11) and identical to `--q-brand` on dark, so the dark theme is
      // byte-for-byte unchanged. It does not move on hover — a boundary that
      // weakens when you point at it is the bug below, again.
      primary:
        "bg-quebi-brand border-quebi-brand-mark text-quebi-on-brand hover:bg-quebi-brand-hover hover:shadow-quebi-glow-strong",
      secondary:
        "bg-quebi-inverse-bg border-quebi-inverse-bg text-quebi-inverse-fg hover:bg-quebi-fg-muted hover:border-quebi-fg-muted",
      outline:
        "bg-transparent border-quebi-line/20 text-quebi-fg hover:border-quebi-brand-mark hover:text-quebi-brand-text",
      ghost:
        "bg-transparent border-transparent text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
      // 600-level fills, darkening on hover. At 500 the white label was 3.96:1
      // (accent) and 3.76:1 (danger) — under 1.4.3's 4.5:1, which `xs` (12px)
      // and `sm` (14px) are squarely subject to — and both intents *lightened*
      // on hover, to 2.64:1 and 2.77:1, so the label faded out exactly when the
      // pointer was on it (task #144). Now 5.38 → 6.98 and 4.83 → 6.47: every
      // size clears 4.5:1, and hover improves it, as `primary` already did.
      accent:
        "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 hover:border-purple-700",
      danger:
        "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700",
    },
    size: {
      xs: ["text-xs px-2.5 py-1.5", "*:data-[slot=icon]:size-3 *:data-[slot=loader]:size-3"],
      sm: ["text-sm px-3 py-2", "*:data-[slot=icon]:size-3.5 *:data-[slot=loader]:size-3.5"],
      md: ["text-base px-5 py-2.5", "*:data-[slot=icon]:size-4 *:data-[slot=loader]:size-4"],
      lg: ["text-lg px-6 py-3", "*:data-[slot=icon]:size-5 *:data-[slot=loader]:size-5"],
      xl: ["text-xl px-8 py-4", "*:data-[slot=icon]:size-6 *:data-[slot=loader]:size-6"],
      // Square / icon-only. `size-*` is border-box, so a square matches its
      // text-sized sibling only if the number includes the 1px border on each
      // side: xs is line-height 16 + py-1.5 12 + 2 = 30px, and so on. They used
      // to be 2px short of the text sizes, which is why an icon-only button
      // never quite lined up with the button beside it.
      "sq-xs": "size-7.5 p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-9.5 p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-11.5 p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-13.5 p-0 *:data-[slot=icon]:size-6",
    },
    // The radius lives here, not in `base`: `rounded-quebi-sm` and
    // `rounded-full` are not one group to tailwind-merge (it cannot know
    // `quebi-sm` is a radius token), so a base radius survives the merge and
    // wins on sheet order — `isCircle` silently does nothing. Mutually
    // exclusive branches never rely on the merge at all.
    isCircle: {
      true: "rounded-full",
      false: "rounded-quebi-sm",
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
