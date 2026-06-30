"use client"

import {
  composeRenderProps,
  ToggleButton as TogglePrimitive,
  type ToggleButtonProps,
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * Toggle — quebi design system
 *
 * A two-state pressable button (think bold/italic in a toolbar). The selected
 * state lights up with brand teal; depth comes from a quebi glow, never a drop
 * shadow.
 *
 * Intents: outline (bordered) / plain (borderless). Sizes follow the button
 * scale, including square (sq-*) icon-only variants.
 */
export const toggleStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-semibold whitespace-nowrap select-none cursor-pointer",
    "rounded-quebi-sm border border-solid",
    "transition-all duration-200 ease-out",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // react-aria slot convention — icons inherit current color
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
  ],
  variants: {
    intent: {
      outline: [
        "bg-transparent border-cyan-500/20 text-quebi-fg-muted",
        "hover:text-white hover:border-quebi-brand",
        "selected:bg-quebi-brand selected:border-quebi-brand selected:text-quebi-bg selected:shadow-quebi-glow selected:hover:bg-quebi-brand-hover selected:hover:border-quebi-brand-hover selected:hover:text-quebi-bg",
      ],
      plain: [
        "bg-transparent border-transparent text-quebi-fg-muted",
        "hover:bg-white/[0.04] hover:text-white",
        "selected:bg-quebi-brand selected:border-quebi-brand selected:text-quebi-bg selected:shadow-quebi-glow selected:hover:bg-quebi-brand-hover selected:hover:text-quebi-bg",
      ],
    },
    size: {
      xs: ["text-xs px-2.5 py-1.5", "*:data-[slot=icon]:size-3.5"],
      sm: ["text-sm px-3 py-2", "*:data-[slot=icon]:size-4"],
      md: ["text-base px-5 py-2.5", "*:data-[slot=icon]:size-5"],
      lg: ["text-lg px-6 py-3", "*:data-[slot=icon]:size-5"],
      // Square / icon-only
      "sq-xs": "size-7 p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-9 p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-11 p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-12 p-0 *:data-[slot=icon]:size-6",
    },
    isCircle: {
      true: "rounded-full",
      false: "",
    },
  },
  defaultVariants: {
    intent: "plain",
    size: "md",
    isCircle: false,
  },
})

export interface ToggleProps extends ToggleButtonProps, VariantProps<typeof toggleStyles> {
  ref?: React.Ref<HTMLButtonElement>
}

export function Toggle({ className, intent, size, isCircle, ref, ...props }: ToggleProps) {
  return (
    <TogglePrimitive
      ref={ref}
      {...props}
      className={composeRenderProps(className, (className) =>
        cn(toggleStyles({ intent, size, isCircle }), className),
      )}
    />
  )
}
