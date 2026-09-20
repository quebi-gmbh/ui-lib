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
 * Depth comes from a token or a neutral rung, never a hand-rolled shadow. Hover lifts
 * with one shadow, the same for every intent; the brand teal is reserved for the
 * primary CTA.
 */
export const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-semibold whitespace-nowrap select-none cursor-pointer",
    "border border-solid",
    // Named properties, not `transition-all` (task #178). `all` animates every
    // animatable property, so a hover fired fill, border, shadow *and* a scale
    // at once — four changes reading as one smear. These five are what actually
    // move: the intents' colours, the lift below, and the opacity that
    // `disabled:`/`pending:` flip.
    "transition-[background-color,border-color,color,box-shadow,opacity] duration-200 ease-out",
    // One hover behaviour for the whole intent set, and a control-scale rung of
    // the neutral ramp rather than the overlay token. `shadow-quebi-glow-strong`
    // is what a *floating surface* takes — the command palette, the active
    // Stepper bullet — and on light it is `0 16px 40px`: a cast the size of the
    // button falling most of a button-height below a 46px control. `modal.tsx`
    // makes the argument (task #137): a dialog is the tallest overlay there is
    // and it still takes the top rung of the *neutral* ramp, because the mint
    // bloom reads as the thing being lit rather than raised. A button is the
    // shortest thing that lifts at all, so it takes the bottom rung. On dark the
    // neutral shadow is quiet by design and the fill change carries the hover —
    // the same trade #137/#141/#142 took for the overlay family.
    //
    // This replaces `hover:scale-[1.02]`, which was the other half of the mess:
    // a control that grows under the pointer pushes its neighbours out of
    // optical alignment in a `ButtonGroup` or a table toolbar, and scaling the
    // box resamples the label, so the text softened for the length of the hover.
    // With the scale gone, `active:scale-100` had nothing left to cancel.
    "hover:shadow-md",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
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
        "bg-quebi-brand border-quebi-brand-mark text-quebi-on-brand hover:bg-quebi-brand-hover",
      secondary:
        "bg-quebi-inverse-bg border-quebi-inverse-bg text-quebi-inverse-fg hover:bg-quebi-fg-muted hover:border-quebi-fg-muted",
      outline:
        "bg-transparent border-quebi-line/20 text-quebi-fg hover:border-quebi-brand-mark hover:text-quebi-brand-text",
      // The one intent that opts out of the base hover shadow, and not as a
      // special case: ghost has no box at rest — no fill, no border — and its
      // hover fill is ink at 4%. A cast shadow there would be stronger than the
      // surface casting it, drawing an edge the button does not have.
      ghost:
        "bg-transparent border-transparent text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg hover:shadow-none",
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
