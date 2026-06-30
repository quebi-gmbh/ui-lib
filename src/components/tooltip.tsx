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
import { tv, type VariantProps } from "tailwind-variants"

/**
 * Tooltip — quebi design system
 *
 * A floating label built on react-aria-components. The surface is a dark
 * panel with a subtle cyan hairline border and an optional arrow that
 * orients itself to the trigger. Depth comes from a quebi glow, never a
 * drop shadow.
 *
 * Compose `Tooltip` (the trigger wrapper) around an interactive
 * `TooltipTrigger` and a `TooltipContent`.
 */
const tooltipStyles = tv({
  base: [
    "group max-w-sm origin-(--trigger-anchor-point) will-change-transform",
    "rounded-quebi-sm border border-cyan-500/20 bg-quebi-bg px-2.5 py-1.5",
    "text-sm/6 text-white shadow-quebi-glow",
    "*:[strong]:font-semibold **:[.text-muted]:text-quebi-fg-muted",
  ],
  variants: {
    isEntering: {
      true: [
        "fade-in animate-in",
        "placement-left:slide-in-from-right-1 placement-right:slide-in-from-left-1 placement-top:slide-in-from-bottom-1 placement-bottom:slide-in-from-top-1",
      ],
    },
    isExiting: {
      true: [
        "fade-in direction-reverse animate-in",
        "placement-left:slide-out-to-right-1 placement-right:slide-out-to-left-1 placement-top:slide-out-to-bottom-1 placement-bottom:slide-out-to-top-1",
      ],
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
        tooltipStyles({
          ...renderProps,
          className,
        }),
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
              "fill-quebi-bg stroke-cyan-500/20",
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
