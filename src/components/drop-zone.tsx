"use client"

import type { DropZoneProps } from "react-aria-components"
import { composeRenderProps, DropZone as DropZonePrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * DropZone — quebi design system
 *
 * Built on react-aria-components. A dashed, cyan-tinted drop surface for drag
 * and drop. The resting border is dashed cyan-500/20; when a draggable item
 * hovers over it (drop target), the border turns solid brand teal with a soft
 * teal wash and the signature quebi glow.
 */
export function DropZone({ className, ...props }: DropZoneProps) {
  return (
    <DropZonePrimitive
      data-slot="control"
      className={composeRenderProps(className, (className, { isDropTarget }) =>
        cn(
          "group/drop-zone relative z-10 flex max-h-56 items-center justify-center overflow-hidden rounded-quebi-md border border-dashed border-cyan-500/20 p-6 text-center text-sm text-quebi-fg-muted",
          "transition-colors duration-150",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
          isDropTarget &&
            "border-solid border-quebi-brand bg-quebi-brand/10 text-white shadow-quebi-glow",
          className,
        ),
      )}
      {...props}
    />
  )
}
