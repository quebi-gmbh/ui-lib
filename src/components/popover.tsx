"use client"

import type { DialogTriggerProps, PopoverProps } from "react-aria-components"
import {
  composeRenderProps,
  DialogTrigger as DialogTriggerPrimitive,
  OverlayArrow,
  Popover as PopoverPrimitive,
} from "react-aria-components"
import { cn } from "@/lib/utils"
import {
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog"

/**
 * Popover — quebi design system
 *
 * A floating overlay anchored to a trigger. Reuses the dialog surface slots
 * (header/body/footer/title/description) inside a react-aria Popover. Foundational
 * — menu / select / combo-box / multiple-select compose this overlay.
 *
 * Surface tokens: bg-quebi-elevated, border-quebi-line/20, plus a neutral
 * `shadow-lg`. Elevation here is occlusion, not emission: the mint
 * `shadow-quebi-glow` this used to carry read as a halo around every menu,
 * select and context menu (task #141, and #137 for the Modal), so mint is
 * reserved for brand-coloured surfaces and an overlay is lifted by a plain
 * drop shadow over a hairline carrying twice its old alpha.
 */
const Popover = (props: DialogTriggerProps) => {
  return <DialogTriggerPrimitive {...props} />
}

const PopoverTitle = DialogTitle
const PopoverHeader = DialogHeader
const PopoverBody = DialogBody
const PopoverFooter = DialogFooter

interface PopoverContentProps extends PopoverProps {
  arrow?: boolean
  ref?: React.Ref<HTMLDivElement>
}

const PopoverContent = ({
  children,
  arrow = false,
  className,
  ref,
  ...props
}: PopoverContentProps) => {
  const offset = props.offset ?? (arrow ? 12 : 8)
  return (
    <PopoverPrimitive
      ref={ref}
      offset={offset}
      className={composeRenderProps(className, (resolved) =>
        cn(
          "[--visual-viewport-vertical-padding:16px] sm:[--visual-viewport-vertical-padding:32px]",
          "group/popover min-w-(--trigger-width) max-w-xs origin-(--trigger-anchor-point) rounded-quebi-md border border-quebi-line/20 bg-quebi-elevated text-quebi-fg shadow-lg outline-hidden transition-transform [--gutter:--spacing(4)] **:[[role=dialog]]:[--gutter:--spacing(4)]",
          // A ListBox is a floating surface on its own (Select and Combo Box
          // render one *inside* this popover), and two elevations stacked on the
          // same edge is the halo again from underneath. The popover owns the
          // elevation; anything it hosts sits flat on it.
          "**:data-[slot=list-box]:shadow-none",
          "entering:fade-in exiting:fade-out entering:animate-in exiting:animate-out",
          "placement-left:entering:slide-in-from-right-1 placement-right:entering:slide-in-from-left-1 placement-top:entering:slide-in-from-bottom-1 placement-bottom:entering:slide-in-from-top-1",
          "placement-left:exiting:slide-out-to-right-1 placement-right:exiting:slide-out-to-left-1 placement-top:exiting:slide-out-to-bottom-1 placement-bottom:exiting:slide-out-to-top-1",
          "forced-colors:bg-[Canvas]",
          resolved,
        ),
      )}
      {...props}
    >
      {(values) => (
        <>
          {arrow && (
            <OverlayArrow className="group">
              <svg
                aria-hidden="true"
                width={12}
                height={12}
                viewBox="0 0 12 12"
                className="block fill-quebi-elevated stroke-quebi-line/20 group-placement-bottom:rotate-180 group-placement-left:-rotate-90 group-placement-right:rotate-90 forced-colors:fill-[Canvas] forced-colors:stroke-[ButtonBorder]"
              >
                <path d="M0 0 L6 6 L12 0" />
              </svg>
            </OverlayArrow>
          )}
          <div data-slot="popover-inner" className="quebi-scrollbar max-h-[inherit] overflow-y-auto">
            {typeof children === "function" ? children(values) : children}
          </div>
        </>
      )}
    </PopoverPrimitive>
  )
}

const PopoverTrigger = DialogTrigger
const PopoverClose = DialogClose
const PopoverDescription = DialogDescription

export type { PopoverContentProps, PopoverProps }
export {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
