"use client"

import type { TooltipProps as TooltipPrimitiveProps } from "react-aria-components"
import {
  Button,
  composeRenderProps,
  OverlayArrow,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "react-aria-components"
import { twJoin } from "tailwind-merge"
import type { VariantProps } from "tailwind-variants"
import { cn, tv } from "@/lib/utils"

/**
 * Tooltip — quebi design system
 *
 * A floating label built on react-aria-components, set on the overlay —
 * `bg-quebi-overlay text-quebi-on-overlay`, slate in Light, ink with a 1px
 * ring in Dark — at caption size, with the mark radius and an optional arrow
 * that orients itself to the trigger. The overlay is what tells it apart from
 * a popover, which is elevated paper and can hold controls; a tooltip only
 * holds words. Its shadow is the overlay's, never the float shadow.
 *
 * Compose `Tooltip` (the trigger wrapper) around an interactive
 * `TooltipTrigger` and a `TooltipContent`.
 */
const tooltipStyles = tv({
  base: [
    "group max-w-sm origin-(--trigger-anchor-point) will-change-transform",
    "rounded-(--q-radius-mark) bg-quebi-overlay px-2.5 py-1.5 shadow-quebi-overlay",
    // The caption size is added outside tv, in TooltipContent: tv's own
    // tailwind-merge does not know the quebi type scale and files
    // `text-quebi-caption` as a colour, dropping one of it and this.
    "text-quebi-on-overlay",
    "*:[strong]:font-medium **:[.text-muted]:text-quebi-on-overlay/70",
    "**:[a]:text-quebi-signal-inverse **:[a]:underline",
    "forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
  ],
  variants: {
    isEntering: {
      true: [
        "fade-in animate-in",
        "placement-left:slide-in-from-right-1 placement-right:slide-in-from-left-1 placement-top:slide-in-from-bottom-1 placement-bottom:slide-in-from-top-1",
      ],
    },
    // A tooltip leaves on its entrance played backwards — `direction-reverse` on
    // the *enter* animation — rather than on a second set of keyframes. So it
    // reads `--quebi-enter-*`, and the `slide-out-to-*` classes that used to sit
    // here set `--quebi-exit-*`, which nothing in this animation reads: they
    // described the motion correctly and produced none of it. Reversing the
    // entrance already lands on exactly the offset they named (task #179).
    isExiting: {
      true: ["fade-in direction-reverse animate-in"],
    },
  },
})

type TooltipProps = React.ComponentProps<typeof TooltipTriggerPrimitive>
const Tooltip = (props: TooltipProps) => <TooltipTriggerPrimitive {...props} />

interface TooltipContentProps
  extends Omit<TooltipPrimitiveProps, "children">,
    VariantProps<typeof tooltipStyles> {
  arrow?: boolean
  children?: React.ReactNode
}

const TooltipContent = ({ offset = 10, arrow = true, children, ...props }: TooltipContentProps) => {
  return (
    <TooltipPrimitive
      {...props}
      offset={offset}
      className={composeRenderProps(props.className, (className, renderProps) =>
        cn("text-quebi-caption", tooltipStyles({ ...renderProps, className })),
      )}
    >
      {arrow && (
        <OverlayArrow className="group">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 12 12"
            className={twJoin(
              "block group-placement-bottom:rotate-180 group-placement-left:-rotate-90 group-placement-right:rotate-90 forced-colors:fill-[Canvas] forced-colors:stroke-[ButtonBorder]",
              "fill-quebi-overlay",
            )}
          >
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
      )}
      {children}
    </TooltipPrimitive>
  )
}

const TooltipTrigger = Button

export type { TooltipContentProps, TooltipProps }
export { Tooltip, TooltipContent, TooltipTrigger }
