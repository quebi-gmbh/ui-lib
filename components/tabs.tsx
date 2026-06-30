"use client"

import { createContext, use } from "react"
import type {
  TabListProps as TabListPrimitiveProps,
  TabPanelProps as TabPanelPrimitiveProps,
  TabPanelsProps,
  TabProps as TabPrimitiveProps,
  TabsProps as TabsPrimitiveProps,
} from "react-aria-components"
import {
  composeRenderProps,
  TabPanels as PrimitiveTabPanels,
  SelectionIndicator,
  TabList as TabListPrimitive,
  TabPanel as TabPanelPrimitive,
  Tab as TabPrimitive,
  TabsContext,
  Tabs as TabsPrimitive,
  useSlottedContext,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { cx } from "@/lib/primitive"

interface TabsProps extends TabsPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}
const Tabs = ({ className, ref, orientation = "horizontal", ...props }: TabsProps) => {
  return (
    <TabsContext value={{ orientation }}>
      <TabsPrimitive
        orientation={orientation}
        className={cx(
          orientation === "vertical" ? "w-full flex-row" : "flex-col",
          "group/tabs flex gap-4 self-start forced-color-adjust-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    </TabsContext>
  )
}
interface TabListContextValue {
  selectionIndicator?: boolean
}
const TabListContext = createContext<TabListContextValue | undefined>(undefined)

export function useTabListContext() {
  const context = use(TabListContext)
  if (!context) {
    throw new Error("useTabsContext must be used within TabsContext.Provider")
  }
  return context
}

interface TabListProps<T extends object> extends TabListPrimitiveProps<T>, TabListContextValue {
  ref?: React.RefObject<HTMLDivElement>
}
const TabList = <T extends object>({
  className,
  selectionIndicator = true,
  ref,
  ...props
}: TabListProps<T>) => {
  return (
    <TabListContext value={{ selectionIndicator }}>
      <TabListPrimitive
        ref={ref}
        data-slot="tab-list"
        {...props}
        className={composeRenderProps(className, (className, { orientation }) =>
          twMerge([
            "relative flex forced-color-adjust-none",
            // Cellestial DS .tabs → border-b ink-100, gap-2 (+ mr-4 on each tab = 24px between).
            orientation === "horizontal" && "flex-row gap-2 border-b border-ink-100",
            orientation === "vertical" &&
              "min-w-56 shrink-0 flex-col items-start gap-y-2 border-l border-ink-100 [--tab-list-gutter:--spacing(2)]",
            className,
          ]),
        )}
      />
    </TabListContext>
  )
}

export function TabScrollArea({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="relative">
      <div className={twMerge("scrollbar-hidden overflow-x-auto sm:overflow-x-visible", className)}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full bg-border"
          aria-hidden
        />
        {props.children}
      </div>
    </div>
  )
}

interface TabProps extends TabPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}
const Tab = ({ className, ref, ...props }: TabProps) => {
  const tabsContext = useSlottedContext(TabsContext)
  if (!tabsContext) throw new Error("Tab must be used within a Tabs component")
  const { orientation } = tabsContext
  const { selectionIndicator } = useTabListContext()
  return (
    <TabPrimitive
      {...props}
      data-slot="tab"
      ref={ref}
      className={cx(
        "group/tab",
        orientation === "horizontal"
          ? // Cellestial DS .tabs button → py-2.5 (10px) no horizontal padding,
            // mr-4 between tabs (combined with TabList gap-2 → 24px visual gap).
            "py-2.5 mr-4 last:mr-0"
          : "w-full justify-start px-4 py-1.5",
        "relative flex cursor-default items-center whitespace-nowrap outline-hidden [-webkit-tap-highlight-color:transparent]",
        // Typography: font-body, 600, 14px. Color ink-500; ink-900 when selected.
        "font-body! font-semibold! text-[14px]! text-ink-500! selected:text-ink-900!",
        "*:data-[slot=icon]:-ms-0.5 *:data-[slot=icon]:me-2 *:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
        "disabled:opacity-50",
        "href" in props ? "cursor-pointer" : "cursor-default",
        className,
      )}
    >
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          {selectionIndicator && (
            <SelectionIndicator
              data-slot="selected-indicator"
              className={twMerge(
                // Spec: 3px solid brand-500, sitting at bottom:-1px so it overlaps
                // the TabList border. rounded-[2px] for a subtle rounded cap.
                "absolute bg-brand-500 rounded-[2px] duration-200 will-change-transform",
                orientation === "horizontal"
                  ? "start-0 end-0 -bottom-[1px] h-[3px] motion-safe:transition-[translate,width]"
                  : "-start-[1px] top-1.5 bottom-1.5 w-[3px] motion-safe:transition-[translate,height]",
              )}
            />
          )}
        </>
      ))}
    </TabPrimitive>
  )
}

interface TabPanelProps extends TabPanelPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}

const TabPanels = <T extends object>(props: TabPanelsProps<T>) => {
  return <PrimitiveTabPanels {...props} />
}

const TabPanel = ({ className, ref, ...props }: TabPanelProps) => {
  return (
    <TabPanelPrimitive
      {...props}
      ref={ref}
      data-slot="tab-panel"
      className={cx("flex-1 text-fg text-sm/6 focus-visible:outline-hidden", className)}
    />
  )
}

export type { TabListProps, TabPanelProps, TabProps, TabsProps }
export { Tab, TabList, TabPanel, TabPanels, Tabs }
