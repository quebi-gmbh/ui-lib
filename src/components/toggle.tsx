"use client"

import {
  composeRenderProps,
  ToggleButton as TogglePrimitive,
  type ToggleButtonProps,
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { cn, tv } from "@/lib/utils"

/**
 * Toggle — quebi design system
 *
 * A two-state pressable button (think bold/italic in a toolbar). Selected is
 * state, so it is the `selected` ground with a `signal` label — the same pair
 * as the active segment of a ToggleGroup.
 *
 * Intents: outline (bordered) / plain (borderless). Sizes follow the button
 * scale, including square (sq-*) icon-only variants.
 */
export const toggleStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-(family-name:--q-font-control) font-medium whitespace-nowrap select-none cursor-pointer",
    "border-(length:--q-border-control) border-solid",
    "transition-[background-color,border-color,color,opacity,translate,box-shadow] duration-150 ease-out",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "disabled:opacity-45 disabled:cursor-not-allowed",
    // react-aria slot convention — icons inherit current color
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
  ],
  variants: {
    intent: {
      outline: [
        "bg-transparent border-quebi-hairline text-quebi-fg shadow-(--q-shadow-control)",
        "hover:bg-quebi-raised",
        // A theme with a hard shadow presses a selected toggle into it.
        "selected:translate-(--q-press) selected:shadow-none",
        "selected:bg-quebi-selected selected:text-quebi-signal",
      ],
      plain: [
        "bg-transparent border-transparent text-quebi-fg-muted",
        "hover:bg-quebi-raised hover:text-quebi-fg",
        "selected:bg-quebi-selected selected:text-quebi-signal",
        "selected:hover:bg-quebi-selected selected:hover:text-quebi-signal",
      ],
    },
    size: {
      xs: ["text-xs px-2.5 py-1.5", "*:data-[slot=icon]:size-3.5"],
      sm: ["text-sm px-3.5 py-2", "*:data-[slot=icon]:size-4"],
      md: ["text-sm px-5 py-3", "*:data-[slot=icon]:size-4"],
      lg: ["text-base px-6 py-3.5", "*:data-[slot=icon]:size-5"],
      // Square / icon-only. `size-*` is border-box, so a square matches its
      // text-sized sibling only if the number includes the 1px border on each
      // side: xs is line-height 16 + py-1.5 12 + 2 = 30px, and so on — see
      // button.tsx, which this scale has to stay in step with.
      "sq-xs": "size-7.5 p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-9.5 p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-11.5 p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-13.5 p-0 *:data-[slot=icon]:size-6",
    },
    // Radius belongs to the variant, not `base` — see button.tsx.
    isCircle: {
      true: "rounded-full",
      false: "rounded-(--q-radius-control)",
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
