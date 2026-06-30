"use client"

import { ChevronsUpDown } from "lucide-react"
import type {
  ListBoxProps,
  PopoverProps,
  SelectProps as SelectPrimitiveProps,
} from "react-aria-components"
import { Button, ListBox, Select as SelectPrimitive, SelectValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
  DropdownSection,
  DropdownSeparator,
} from "@/components/dropdown"
import { PopoverContent } from "@/components/popover"

/**
 * Select — quebi design system
 *
 * An accessible single/multiple select built on react-aria-components. The
 * trigger reuses the quebi input style (translucent field, cyan hairline,
 * brand-teal focus ring); the chevron is muted; the options reuse the dropdown
 * surface and items. Foundational — Calendar and Conform Select compose this.
 */

interface SelectProps<T extends object, M extends "single" | "multiple" = "single">
  extends SelectPrimitiveProps<T, M> {
  items?: Iterable<T, M>
}

const Select = <T extends object, M extends "single" | "multiple" = "single">({
  className,
  ...props
}: SelectProps<T, M>) => {
  return (
    <SelectPrimitive
      data-slot="control"
      className={cn("group/select w-full", className)}
      {...props}
    />
  )
}

interface SelectListProps<T extends object>
  extends Omit<ListBoxProps<T>, "layout" | "orientation"> {
  items?: Iterable<T>
  popover?: Omit<PopoverProps, "children">
}

const SelectContent = <T extends object>({
  items,
  className,
  popover,
  ...props
}: SelectListProps<T>) => {
  return (
    <PopoverContent
      placement={popover?.placement ?? "bottom"}
      className={cn(
        "min-w-(--trigger-width) scroll-py-1 overflow-y-auto overscroll-contain",
        popover?.className,
      )}
      {...popover}
    >
      <ListBox
        layout="stack"
        orientation="vertical"
        className={cn(
          "grid max-h-96 w-full grid-cols-[auto_1fr] flex-col gap-y-1 overflow-y-auto p-1 outline-hidden *:[[role='group']+[role=group]]:mt-4 *:[[role='group']+[role=separator]]:mt-1",
          className,
        )}
        items={items}
        {...props}
      />
    </PopoverContent>
  )
}

interface SelectTriggerProps extends React.ComponentProps<typeof Button> {
  prefix?: React.ReactNode
  className?: string
}

const SelectTrigger = ({ children, className, ...props }: SelectTriggerProps) => {
  return (
    <span data-slot="control" className="relative block w-full">
      <Button
        className={cn(
          // quebi input style — translucent field, cyan hairline, brand-teal focus.
          "group/select-trigger flex w-full min-w-0 cursor-default items-center gap-x-2 text-start text-sm text-white",
          "rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02] px-3 py-2.5",
          "transition-[border-color,box-shadow] duration-200",
          "enabled:hover:border-cyan-500/40",
          // focus / open → brand-teal border + ring.
          "outline-none focus:outline-none focus:border-quebi-brand focus:ring-2 focus:ring-quebi-brand/50",
          "group-open/select:border-quebi-brand group-open/select:ring-2 group-open/select:ring-quebi-brand/50",
          // invalid wins via red border + ring.
          "group-invalid/select:border-red-500 group-invalid/select:focus:ring-red-500/50 group-invalid/select:group-open/select:ring-red-500/50",
          // leading icons / loader, muted.
          "*:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-quebi-fg-muted",
          "*:data-[slot=loader]:size-4 *:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center *:data-[slot=loader]:text-quebi-fg-muted",
          "group-disabled/select:cursor-not-allowed group-disabled/select:opacity-50",
          "in-disabled:opacity-50",
          className,
        )}
      >
        {(values) => (
          <>
            {props.prefix && <span className="text-quebi-fg-muted">{props.prefix}</span>}
            {typeof children === "function" ? children(values) : children}

            {!children && (
              <>
                <SelectValue
                  data-slot="select-value"
                  className={cn(
                    "truncate text-start text-sm data-placeholder:text-quebi-fg-subtle **:[[slot=description]]:hidden",
                    "has-data-[slot=avatar]:grid has-data-[slot=avatar]:grid-cols-[1fr_auto] has-data-[slot=avatar]:items-center has-data-[slot=avatar]:gap-x-2",
                    "has-data-[slot=icon]:grid has-data-[slot=icon]:grid-cols-[1fr_auto] has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-2",
                    "*:data-[slot=icon]:size-4",
                    "*:mt-0 *:data-[slot=avatar]:[--avatar-size:--spacing(4)]",
                  )}
                />
                <ChevronsUpDown
                  data-slot="chevron"
                  className="ms-auto -me-1 size-4 shrink-0 text-quebi-fg-muted"
                />
              </>
            )}
          </>
        )}
      </Button>
    </span>
  )
}

const SelectSection = DropdownSection
const SelectSeparator = DropdownSeparator
const SelectLabel = DropdownLabel
const SelectDescription = DropdownDescription
const SelectItem = DropdownItem

export type { SelectProps, SelectTriggerProps }
export {
  Select,
  SelectContent,
  SelectDescription,
  SelectItem,
  SelectLabel,
  SelectSection,
  SelectSeparator,
  SelectTrigger,
}
