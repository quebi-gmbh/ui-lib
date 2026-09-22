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
 *
 * ## A group is not as tall as a button of the same name
 *
 * The shell wraps its items in `p-0.5` and a border, so it always stands 6px
 * taller than the item inside it — `size="xs"` is a 30px item in a 36px box,
 * which is the size of nothing else in the library. Beside a `Button
 * size="sm"` (38px) that is 1px of misalignment top and bottom, and swapping
 * up to `size="sm"` overshoots by the same 6px in the other direction (task
 * #209).
 *
 * `height="control"` is the way out: the *shell* takes the height a `Button`
 * of that size has, and the items give the 6px back out of their own padding.
 * So `<ToggleGroup size="sm" height="control">` is 38px overall with `text-sm`
 * items, which is what a toolbar row wants — see the note in `toolbar.tsx`.
 * It applies to a horizontal group only: a fixed height on a column would
 * squash it, and the items there are already one width.
 */

type ToggleGroupSize = "xs" | "sm" | "md" | "lg" | "sq-xs" | "sq-sm" | "sq-md" | "sq-lg"

/**
 * What decides the group's height.
 *
 * - `natural` — the items do, and the shell is 6px taller. The default, and
 *   what a group standing on its own wants.
 * - `control` — the shell does, matching the `Button` of the same size, and
 *   the items lose the difference from their padding. What a group sharing a
 *   row with buttons or inputs wants.
 */
export type ToggleGroupHeight = "natural" | "control"

/** The height a `Button` of each size is — see the note in `button.tsx`. */
const CONTROL_HEIGHTS: Record<ToggleGroupSize, string> = {
  xs: "h-7.5",
  sm: "h-9.5",
  md: "h-11.5",
  lg: "h-13.5",
  "sq-xs": "h-7.5",
  "sq-sm": "h-9.5",
  "sq-md": "h-11.5",
  "sq-lg": "h-13.5",
}

interface ToggleGroupContextValue
  extends Pick<ToggleButtonGroupProps, "selectionMode" | "orientation"> {
  size?: ToggleGroupSize
  height?: ToggleGroupHeight
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: "md",
  height: "natural",
  selectionMode: "single",
  orientation: "horizontal",
})

const useToggleGroupContext = () => use(ToggleGroupContext)

export interface ToggleGroupProps extends ToggleButtonGroupProps {
  size?: ToggleGroupSize
  /** Whether the shell or the items decide the height. Default `natural`. */
  height?: ToggleGroupHeight
  isCircle?: boolean
}

export function ToggleGroup({
  size = "md",
  height = "natural",
  orientation = "horizontal",
  selectionMode = "single",
  isCircle,
  className,
  ...props
}: ToggleGroupProps) {
  const isFixedHeight = height === "control" && orientation === "horizontal"

  return (
    <ToggleGroupContext.Provider
      value={{ size, height: isFixedHeight ? "control" : "natural", selectionMode, orientation }}
    >
      <ToggleButtonGroup
        data-slot="control"
        selectionMode={selectionMode}
        orientation={orientation}
        className={composeRenderProps(className, (resolved) =>
          cn(
            "inline-flex p-0.5",
            "border border-solid border-quebi-line/10 bg-quebi-bg/40",
            orientation === "horizontal" ? "flex-row" : "flex-col",
            selectionMode === "single" ? "gap-0.5" : "gap-0",
            isCircle ? "rounded-full" : "rounded-quebi-md",
            isFixedHeight && CONTROL_HEIGHTS[size],
            resolved,
          ),
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
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg focus-visible:z-10",
    "hover:not-selected:bg-quebi-surface/[0.04] hover:not-selected:text-quebi-fg",
    // The selected item's mint fill is edged in `--q-brand-mark` (teal-600 on
    // light, 3.45:1 against the page; identical to the fill token on dark), and
    // the edge holds on hover. Mint edged in mint was 1.74:1 — no boundary at
    // all on the light page. See button.tsx and task #145.
    "selected:bg-quebi-brand selected:border-quebi-brand-mark selected:text-quebi-on-brand selected:shadow-quebi-glow selected:hover:bg-quebi-brand-hover",
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
      // Square / icon-only. `size-*` is border-box, so a square matches its
      // text-sized sibling only if the number includes the 1px border on each
      // side: xs is line-height 16 + py-1.5 12 + 2 = 30px, and so on. They used
      // to be 2px short of the text sizes, which is why an icon-only button
      // never quite lined up with the button beside it.
      "sq-xs": "size-7.5 p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-9.5 p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-11.5 p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-13.5 p-0 *:data-[slot=icon]:size-6",
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
  const { size, height, selectionMode, orientation } = useToggleGroupContext()
  const resolvedSize = sizeProp ?? size

  // The shell is stretching this item to a height it chose, so the item's own
  // is in the way: a text size keeps its padding but stops adding to it, and a
  // square one drops the fixed `size-*` and takes its width from the height it
  // was stretched to, which is what keeps it square at any shell height.
  const fitsShell =
    height === "control" &&
    (resolvedSize?.startsWith("sq-") ? "h-auto w-auto p-0 aspect-square" : "h-auto py-0")

  return (
    <ToggleButton
      data-slot="toggle-group-item"
      className={composeRenderProps(className, (className) =>
        cn(
          toggleGroupItemStyles({
            size: resolvedSize,
            orientation,
            selectionMode,
          }),
          fitsShell,
          className,
        ),
      )}
      {...props}
    />
  )
}
