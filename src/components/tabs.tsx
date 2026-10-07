"use client"

import { createContext, use } from "react"
import {
  composeRenderProps,
  TabList as TabListPrimitive,
  type TabListProps as TabListPrimitiveProps,
  TabPanel as TabPanelPrimitive,
  type TabPanelProps as TabPanelPrimitiveProps,
  TabPanels as TabPanelsPrimitive,
  type TabPanelsProps,
  Tab as TabPrimitive,
  type TabProps as TabPrimitiveProps,
  Tabs as TabsPrimitive,
  type TabsProps as TabsPrimitiveProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Tabs — quebi design system
 *
 * Built on react-aria-components. Underline tabs, no pills: the list sits on a
 * hairline, inactive tabs are subtle Outfit at nav size, and the selected tab
 * turns ink with a 2px action-ink rule over the hairline — along the bottom border when
 * horizontal, on the inline-start border when vertical. Orientation reaches `Tab` through
 * `TabsContext`, since react-aria exposes it to `TabList` but not to `Tab`.
 * Keyboard and focus handling come from react-aria.
 */

type TabsOrientation = NonNullable<TabsPrimitiveProps["orientation"]>

const TabsContext = createContext<{ orientation: TabsOrientation }>({
  orientation: "horizontal",
})

interface TabsProps extends TabsPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}

export function Tabs({ className, ref, orientation = "horizontal", ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ orientation }}>
      <TabsPrimitive
        ref={ref}
        orientation={orientation}
        data-slot="tabs"
        className={composeRenderProps(className, (className) =>
          cn(
            "group/tabs flex gap-4 self-start forced-color-adjust-none",
            orientation === "vertical" ? "w-full flex-row" : "flex-col",
            className,
          ),
        )}
        {...props}
      />
    </TabsContext.Provider>
  )
}

interface TabListProps<T extends object> extends TabListPrimitiveProps<T> {
  ref?: React.RefObject<HTMLDivElement>
}

export function TabList<T extends object>({ className, ref, ...props }: TabListProps<T>) {
  return (
    <TabListPrimitive
      ref={ref}
      data-slot="tab-list"
      className={composeRenderProps(className, (className, { orientation }) =>
        cn(
          "relative flex forced-color-adjust-none",
          orientation === "horizontal" && "flex-row gap-6 border-b border-quebi-hairline",
          orientation === "vertical" &&
            "min-w-56 shrink-0 flex-col items-start gap-y-2 border-s border-quebi-hairline",
          className,
        ),
      )}
      {...props}
    />
  )
}

interface TabProps extends TabPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}

export function Tab({ className, ref, ...props }: TabProps) {
  const { orientation } = use(TabsContext)

  return (
    <TabPrimitive
      ref={ref}
      data-slot="tab"
      className={composeRenderProps(className, (className, { isSelected }) =>
        cn(
          "group/tab relative flex items-center whitespace-nowrap py-2.5 font-display text-quebi-nav outline-hidden transition-colors duration-150 [-webkit-tap-highlight-color:transparent]",
          // Vertical tabs sit against the list's inline-start rail, so they need
          // the inline padding that `py-2.5` alone gives the horizontal strip.
          orientation === "vertical" && "ps-4",
          // Quiet until selected: subtle text, ink when hovered or selected.
          "text-quebi-fg-subtle selected:text-quebi-fg hover:text-quebi-fg",
          "focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-3 focus-visible:ring-offset-quebi-bg",
          // Icons inside tabs.
          "*:data-[slot=icon]:-ms-0.5 *:data-[slot=icon]:me-2 *:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "href" in props ? "cursor-pointer" : "cursor-default",
          // The ink rule, square, laid over the list's hairline.
          "after:absolute after:bg-quebi-action after:opacity-0 after:transition-opacity after:duration-150 selected:after:opacity-100",
          orientation === "vertical"
            ? "after:inset-y-0 after:-start-px after:w-0.5"
            : "after:inset-x-0 after:-bottom-px after:h-0.5",
          isSelected && "after:opacity-100",
          className,
        ),
      )}
      {...props}
    />
  )
}

export function TabPanels<T extends object>(props: TabPanelsProps<T>) {
  return <TabPanelsPrimitive data-slot="tab-panels" {...props} />
}

interface TabPanelProps extends TabPanelPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}

export function TabPanel({ className, ref, ...props }: TabPanelProps) {
  return (
    <TabPanelPrimitive
      ref={ref}
      data-slot="tab-panel"
      className={composeRenderProps(className, (className) =>
        cn("flex-1 text-quebi-body text-quebi-fg-muted focus-visible:outline-hidden", className),
      )}
      {...props}
    />
  )
}

export type { TabsProps, TabListProps, TabProps, TabPanelProps }
