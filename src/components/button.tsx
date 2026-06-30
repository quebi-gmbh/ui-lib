"use client"

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
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
 * Depth comes from quebi glows, never drop shadows. Hover lifts with a
 * subtle scale; the brand teal is reserved for the primary CTA.
 */
export const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-semibold whitespace-nowrap select-none cursor-pointer",
    "rounded-quebi-sm border border-solid",
    "transition-all duration-200 ease-out",
    "hover:scale-[1.02] active:scale-100",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    "pending:opacity-70 pending:cursor-wait",
    // react-aria slot conventions — icons & loaders inherit current color
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
    "*:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center",
  ],
  variants: {
    intent: {
      primary:
        "bg-quebi-brand border-quebi-brand text-quebi-bg hover:bg-quebi-brand-hover hover:border-quebi-brand-hover hover:shadow-quebi-glow-strong",
      secondary:
        "bg-white border-white text-quebi-bg hover:bg-quebi-fg-muted hover:border-quebi-fg-muted",
      outline:
        "bg-transparent border-cyan-500/20 text-white hover:border-quebi-brand hover:text-quebi-brand",
      ghost:
        "bg-transparent border-transparent text-quebi-fg-muted hover:bg-white/[0.04] hover:text-white",
      accent:
        "bg-purple-500 border-purple-500 text-white hover:bg-purple-400 hover:border-purple-400",
      danger:
        "bg-red-500 border-red-500 text-white hover:bg-red-400 hover:border-red-400",
    },
    size: {
      xs: ["text-xs px-2.5 py-1.5", "*:data-[slot=icon]:size-3 *:data-[slot=loader]:size-3"],
      sm: ["text-sm px-3 py-2", "*:data-[slot=icon]:size-3.5 *:data-[slot=loader]:size-3.5"],
      md: ["text-base px-5 py-2.5", "*:data-[slot=icon]:size-4 *:data-[slot=loader]:size-4"],
      lg: ["text-lg px-6 py-3", "*:data-[slot=icon]:size-5 *:data-[slot=loader]:size-5"],
      xl: ["text-xl px-8 py-4", "*:data-[slot=icon]:size-6 *:data-[slot=loader]:size-6"],
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
      className={cn(buttonStyles({ intent, size, isCircle }), className)}
    />
  )
}
