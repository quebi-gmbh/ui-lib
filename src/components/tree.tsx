"use client"

import { ChevronRight } from "lucide-react"
import type {
  TreeItemContentProps,
  TreeItemContentRenderProps,
  TreeItemProps,
  TreeProps,
} from "react-aria-components"
import {
  Button,
  composeRenderProps,
  TreeItemContent,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
} from "react-aria-components"
import { Checkbox } from "@/components/checkbox"
import { cn } from "@/lib/utils"

/**
 * Tree — quebi design system
 *
 * Built on react-aria-components. A collapsible, optionally multi-selectable
 * tree view of flat rows at the control radius: a hovered row is raised, a
 * selected one takes the `selected` ground with its icon in signal, and focus
 * is an inset ring because the rows touch. Expand chevrons
 * are muted and rotate on open. Supports checkbox selection via the Checkbox
 * sibling.
 */
const Tree = <T extends object>({ className, ...props }: TreeProps<T>) => {
  return (
    <TreePrimitive
      className={composeRenderProps(className, (resolved) =>
        cn(
          "flex cursor-default flex-col overflow-auto outline-hidden forced-color-adjust-none",
          resolved,
        ),
      )}
      {...props}
    />
  )
}

const TreeItem = <T extends object>({ className, ...props }: TreeItemProps<T>) => {
  return (
    <TreeItemPrimitive
      className={composeRenderProps(className, (resolved) =>
        cn(
          "group/tree-item relative flex shrink-0 select-none rounded-(--q-radius-control) px-2 py-1.5",
          "text-sm/6 text-quebi-fg transition-colors duration-150 focus:outline-hidden",
          "hover:bg-quebi-raised",
          "selected:bg-quebi-selected selected:text-quebi-on-selected selected:hover:bg-quebi-selected",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-quebi-focus",
          "**:data-[slot=icon]:me-1 **:data-[slot=icon]:size-4 **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:text-quebi-fg-muted selected:**:data-[slot=icon]:text-quebi-signal",
          "disabled:opacity-50",
          "href" in props ? "cursor-pointer" : "cursor-default",
          resolved,
        ),
      )}
      {...props}
    />
  )
}

interface TreeContentProps extends TreeItemContentProps {
  className?: string
}

const TreeContent = ({ className, children, ...props }: TreeContentProps) => {
  return (
    <TreeItemContent {...props}>
      {(values) => (
        <div
          className={cn(
            "relative flex w-full min-w-0 items-center gap-x-1 truncate text-sm/6",
            className,
          )}
        >
          {values.selectionMode === "multiple" && values.selectionBehavior === "toggle" && (
            <Checkbox slot="selection" />
          )}
          <div
            aria-hidden
            className="relative w-[calc(calc(var(--tree-item-level)-1)*calc(var(--spacing)*5))] shrink-0"
          />
          {values.hasChildItems ? (
            <TreeIndicator
              values={{
                isDisabled: values.isDisabled,
                isExpanded: values.isExpanded,
              }}
            />
          ) : (
            <span aria-hidden className="block w-5 shrink-0" />
          )}
          {typeof children === "function" ? children(values) : children}
        </div>
      )}
    </TreeItemContent>
  )
}

const TreeIndicator = ({
  values,
}: {
  values: Pick<TreeItemContentRenderProps, "isDisabled" | "isExpanded">
}) => {
  return (
    <Button
      slot="chevron"
      isDisabled={values.isDisabled}
      className={cn(
        "shrink-0 content-center text-quebi-fg-muted transition-colors duration-150 hover:text-quebi-fg",
        values.isExpanded && "text-quebi-fg",
      )}
    >
      <ChevronRight
        data-slot="chevron"
        className={cn(
          "size-4 transition-transform duration-200 ease-in-out sm:size-5",
          values.isExpanded && "rotate-90",
        )}
      />
    </Button>
  )
}

export type { TreeItemProps, TreeProps }
export { Tree, TreeContent, TreeIndicator, TreeItem }
