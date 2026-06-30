"use client"

import { useState } from "react"
import { Pressable } from "react-aria-components"
import { Tooltip, TooltipContent } from "@/components/tooltip"
import { cn } from "@/lib/utils"

/**
 * Tracker — quebi design system
 *
 * A horizontal strip of thin cells for visualizing a series of states over
 * time (uptime, incident history, activity heatmaps). Each cell can carry a
 * semantic status color and an optional tooltip. Empty/default cells use the
 * quebi cyan hairline tint; status cells keep their semantic meaning
 * (success / warning / error).
 */
interface TrackerBlockProps {
  key?: string | number
  /** Tailwind background class for the cell, e.g. `bg-green-500`. */
  color?: string
  tooltip?: string
  /** Background class used when `color` is omitted. */
  defaultBackgroundColor?: string
  disabledTooltip?: boolean
}

const Block = ({
  color,
  tooltip,
  disabledTooltip,
  defaultBackgroundColor = "bg-cyan-500/10",
}: TrackerBlockProps) => {
  const [open, setOpen] = useState(false)

  const cell = (
    <div className="size-full overflow-hidden px-[0.5px] transition first:rounded-s-quebi-sm first:ps-0 last:rounded-e-quebi-sm last:pe-0 sm:px-px">
      <div
        className={cn(
          "size-full rounded-[1px] transition-opacity",
          color || defaultBackgroundColor,
          "hover:opacity-60",
        )}
      />
    </div>
  )

  return disabledTooltip ? (
    cell
  ) : (
    <Tooltip isOpen={open} onOpenChange={setOpen} delay={0} closeDelay={0}>
      <Pressable onClick={() => setOpen(true)}>{cell}</Pressable>
      <TooltipContent arrow={false} offset={10} placement="top" className="px-2 py-1.5 text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

interface TrackerProps
  extends React.ComponentProps<"div">,
    Pick<TrackerBlockProps, "disabledTooltip"> {
  data: TrackerBlockProps[]
  defaultBackgroundColor?: string
}

const Tracker = ({
  data = [],
  disabledTooltip = false,
  defaultBackgroundColor,
  className,
  ref,
  ...props
}: TrackerProps) => {
  return (
    <div ref={ref} className={cn("group flex h-8 w-full items-center", className)} {...props}>
      {data.map((blockProps, index) => (
        <Block
          disabledTooltip={disabledTooltip}
          defaultBackgroundColor={defaultBackgroundColor}
          key={blockProps.key ?? index}
          {...blockProps}
        />
      ))}
    </div>
  )
}

export { Tracker, type TrackerBlockProps, type TrackerProps }
