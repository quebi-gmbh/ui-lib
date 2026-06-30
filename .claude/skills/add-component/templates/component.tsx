"use client"

// Component template for quebi ui-lib. Replace <Thing>/<thing> and the primitive.
// Keep imports self-contained: @/lib/utils, npm packages, and @/components/<sibling> only.

import {
  /* SomethingPrimitive, type SomethingProps as SomethingPrimitiveProps */
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * <Thing> — quebi design system
 *
 * One-line summary of intents/sizes/states. Teal is the accent (primary/active
 * only). Depth from quebi glows, never drop shadows.
 */
export const thingStyles = tv({
  base: [
    "transition-colors duration-200",
    "rounded-quebi-sm border border-cyan-500/20",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  variants: {
    intent: {
      primary: "bg-quebi-brand border-quebi-brand text-quebi-bg hover:bg-quebi-brand-hover",
      outline: "bg-transparent text-white hover:border-quebi-brand hover:text-quebi-brand",
    },
    size: {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "md",
  },
})

export interface ThingProps
  extends /* SomethingPrimitiveProps, */ VariantProps<typeof thingStyles> {
  className?: string
}

export function Thing({ className, intent, size, ...props }: ThingProps) {
  return (
    // <SomethingPrimitive
    <div
      {...props}
      className={cn(thingStyles({ intent, size }), className)}
    />
  )
}
