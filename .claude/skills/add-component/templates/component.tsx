"use client"

// Component template for quebi ui-lib. Replace <Thing>/<thing> and the primitive.
// Keep imports self-contained: @/lib/utils, npm packages, and @/components/<sibling> only.

import {
  /* SomethingPrimitive, type SomethingProps as SomethingPrimitiveProps */
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { cn, tv } from "@/lib/utils"

/**
 * <Thing> — quebi design system
 *
 * One-line summary of intents/sizes/states. Ink & Paper: square, ruled, no hue;
 * the solid intent is action ink. No shadow unless the thing floats.
 */
export const thingStyles = tv({
  base: [
    "transition-colors duration-150",
    "border",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-3 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-45 disabled:cursor-not-allowed",
  ],
  variants: {
    intent: {
      primary:
        "bg-quebi-action border-quebi-action text-quebi-on-action hover:bg-quebi-action-hover hover:border-quebi-action-hover",
      outline: "bg-transparent border-quebi-rule text-quebi-fg hover:bg-quebi-raised",
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
