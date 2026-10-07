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
 * status color and an optional tooltip. Empty cells are the raised ground, so
 * the strip reads as one ruled band; a status cell uses a state token
 * (`bg-quebi-success` / `-warn` / `-danger`) when its state is semantic, and
 * ink (`bg-quebi-action`) when it only marks that something happened.
 */
interface TrackerBlockProps {
  key?: string | number
  /** Tailwind background class for the cell, e.g. `bg-quebi-success`. */
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
  defaultBackgroundColor = "bg-quebi-raised",
}: TrackerBlockProps) => {
  const [open, setOpen] = useState(false)

  const cell = (
    <div className="size-full overflow-hidden px-px first:ps-0 last:pe-0">
      <div
        className={cn(
          "size-full transition-opacity duration-150",
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
