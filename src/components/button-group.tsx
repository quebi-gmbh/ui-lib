"use client"

import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * ButtonGroup — quebi design system
 *
 * Joins a row (or column) of buttons / inputs into a single connected unit:
 * shared borders are collapsed and the inner radii squared off so the children
 * read as one segmented control. Self-contained — drop any buttons inside.
 *
 * Use `ButtonGroupText` for non-interactive labels or addons that sit flush
 * with the buttons (e.g. units, prefixes).
 */
const buttonGroupStyles = tv({
  base: [
    "flex w-fit items-stretch",
    // keep focused child above its neighbours so the ring isn't clipped
    "*:focus-visible:relative *:focus-visible:z-10",
    // nested groups get breathing room
    "has-[>[data-slot=button-group]]:gap-2",
    // text inputs flex to fill
    "[&>input]:flex-1",
  ],
  variants: {
    orientation: {
      horizontal:
        "[&>*:not(:first-child)]:rounded-s-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-e-none",
      vertical:
        "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

export interface ButtonGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof buttonGroupStyles> {}

export function ButtonGroup({ className, orientation, ...props }: ButtonGroupProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: no semantic HTML element for button group role
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupStyles({ orientation }), className)}
      {...props}
    />
  )
}

export function ButtonGroupText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group-text"
      className={cn(
        "flex items-center gap-2 whitespace-nowrap",
        "rounded-quebi-sm border border-cyan-500/10 bg-white/[0.03] px-4",
        "font-sans text-sm font-medium text-quebi-fg-muted",
        "*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:shrink-0",
        "[&_[data-slot=icon]:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}
