"use client"

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
 * Built on react-aria-components. A quiet tab strip: inactive tabs are muted,
 * the active tab shifts to brand teal with a 2px teal underline that sits on the
 * list's bottom border. Supports horizontal and vertical orientation. Keyboard
 * and focus handling come from react-aria.
 */
interface TabsProps extends TabsPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}

export function Tabs({ className, ref, orientation = "horizontal", ...props }: TabsProps) {
  return (
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
          orientation === "horizontal" && "flex-row gap-6 border-b border-cyan-500/10",
          orientation === "vertical" &&
            "min-w-56 shrink-0 flex-col items-start gap-y-2 border-l border-cyan-500/10",
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
  return (
    <TabPrimitive
      ref={ref}
      data-slot="tab"
      className={composeRenderProps(className, (className, { isSelected }) =>
        cn(
          "group/tab relative flex items-center whitespace-nowrap py-2.5 text-sm font-semibold outline-hidden transition-colors duration-150 [-webkit-tap-highlight-color:transparent]",
          // Quiet until selected: muted text, brand teal when active.
          "text-quebi-fg-muted selected:text-quebi-brand hover:text-white selected:hover:text-quebi-brand",
          "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg rounded-quebi-sm",
          // Icons inside tabs.
          "*:data-[slot=icon]:-ms-0.5 *:data-[slot=icon]:me-2 *:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "href" in props ? "cursor-pointer" : "cursor-default",
          // Brand teal indicator overlapping the list border. 2px radius cap.
          "after:absolute after:bg-quebi-brand after:rounded-[2px] after:duration-200 after:opacity-0 selected:after:opacity-100",
          "after:inset-x-0 after:-bottom-px after:h-[2px]",
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
        cn("flex-1 text-sm/6 text-white focus-visible:outline-hidden", className),
      )}
      {...props}
    />
  )
}

export type { TabsProps, TabListProps, TabProps, TabPanelProps }
