"use client"

import type { DropZoneProps } from "react-aria-components"
import { composeRenderProps, DropZone as DropZonePrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * DropZone — quebi design system
 *
 * Built on react-aria-components. A square drop surface edged in a dashed
 * hairline. While a draggable item is over it (drop target) the edge turns a
 * solid `rule` and the ground lifts to `raised` — no hue, no glow.
 */
export function DropZone({ className, ...props }: DropZoneProps) {
  return (
    <DropZonePrimitive
      data-slot="control"
      className={composeRenderProps(className, (className, { isDropTarget }) =>
        cn(
          "group/drop-zone relative z-10 flex max-h-56 items-center justify-center overflow-hidden border border-dashed border-quebi-hairline p-6 text-center text-sm text-quebi-fg-muted",
          "transition-colors duration-150",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-3 data-[focus-visible]:ring-offset-quebi-bg",
          isDropTarget &&
            "border-solid border-quebi-rule bg-quebi-raised text-quebi-fg",
          className,
        ),
      )}
      {...props}
    />
  )
}
