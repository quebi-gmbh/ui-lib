"use client"

import { createContext, use } from "react"
import {
  composeRenderProps,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * ToggleGroup — quebi design system
 *
 * A set of two-state pressable buttons that act as one control (think a view
 * switcher or a text-alignment toolbar). Selected items light up with brand
 * teal; in single-selection mode items float with a small gutter, in multiple
 * mode they butt together into a segmented bar. Self-contained — the item
 * styles live here rather than reaching for a sibling Toggle.
 */

type ToggleGroupSize = "xs" | "sm" | "md" | "lg" | "sq-xs" | "sq-sm" | "sq-md" | "sq-lg"

interface ToggleGroupContextValue
  extends Pick<ToggleButtonGroupProps, "selectionMode" | "orientation"> {
  size?: ToggleGroupSize
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: "md",
  selectionMode: "single",
  orientation: "horizontal",
})

const useToggleGroupContext = () => use(ToggleGroupContext)

export interface ToggleGroupProps extends ToggleButtonGroupProps {
  size?: ToggleGroupSize
  isCircle?: boolean
}

export function ToggleGroup({
  size = "md",
  orientation = "horizontal",
  selectionMode = "single",
  isCircle,
  className,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ size, selectionMode, orientation }}>
      <ToggleButtonGroup
        data-slot="control"
        selectionMode={selectionMode}
        orientation={orientation}
        className={cn(
          "inline-flex p-0.5",
          "border border-solid border-cyan-500/10 bg-quebi-bg/40",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          selectionMode === "single" ? "gap-0.5" : "gap-0",
          isCircle ? "rounded-full" : "rounded-quebi-md",
          className,
        )}
        {...props}
      />
    </ToggleGroupContext.Provider>
  )
}

export const toggleGroupItemStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-sans font-semibold whitespace-nowrap select-none cursor-pointer",
    "border border-solid border-transparent text-quebi-fg-muted",
    "transition-all duration-200 ease-out",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg focus-visible:z-10",
    "hover:not-selected:bg-white/[0.04] hover:not-selected:text-white",
    "selected:bg-quebi-brand selected:border-quebi-brand selected:text-quebi-bg selected:shadow-quebi-glow selected:hover:bg-quebi-brand-hover selected:hover:border-quebi-brand-hover",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
  ],
  variants: {
    orientation: {
      horizontal: "justify-center",
      vertical: "justify-start",
    },
    selectionMode: {
      single: "rounded-quebi-sm",
      multiple: "rounded-none",
    },
    size: {
      xs: ["text-xs px-2.5 py-1.5", "*:data-[slot=icon]:size-3.5"],
      sm: ["text-sm px-3 py-2", "*:data-[slot=icon]:size-4"],
      md: ["text-base px-5 py-2.5", "*:data-[slot=icon]:size-5"],
      lg: ["text-lg px-6 py-3", "*:data-[slot=icon]:size-5"],
      "sq-xs": "size-7 p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-9 p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-11 p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-12 p-0 *:data-[slot=icon]:size-6",
    },
  },
  defaultVariants: {
    size: "md",
    selectionMode: "single",
    orientation: "horizontal",
  },
  compoundVariants: [
    {
      selectionMode: "multiple",
      orientation: "horizontal",
      className: "not-first:-ms-px first:rounded-s-quebi-sm last:rounded-e-quebi-sm",
    },
    {
      selectionMode: "multiple",
      orientation: "vertical",
      className: "not-first:-mt-px first:rounded-t-quebi-sm last:rounded-b-quebi-sm",
    },
  ],
})

export interface ToggleGroupItemProps
  extends ToggleButtonProps,
    Pick<VariantProps<typeof toggleGroupItemStyles>, "size"> {}

export function ToggleGroupItem({ className, size: sizeProp, ...props }: ToggleGroupItemProps) {
  const { size, selectionMode, orientation } = useToggleGroupContext()

  return (
    <ToggleButton
      data-slot="toggle-group-item"
      className={composeRenderProps(className, (className) =>
        cn(
          toggleGroupItemStyles({
            size: sizeProp ?? size,
            orientation,
            selectionMode,
          }),
          className,
        ),
      )}
      {...props}
    />
  )
}
