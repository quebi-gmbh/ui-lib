"use client"

import { ChevronsUpDown } from "lucide-react"
import type {
  ComboBoxProps as ComboboxPrimitiveProps,
  InputProps as PrimitiveInputProps,
  ListBoxProps,
  PopoverProps,
} from "react-aria-components"
import {
  Button,
  ComboBoxContext,
  ComboBox as ComboboxPrimitive,
  ListBox,
  useSlottedContext,
} from "react-aria-components"
import { cn } from "@/lib/utils"
import { DropdownDescription, DropdownItem, DropdownLabel, DropdownSection } from "@/components/dropdown"
import { PopoverContent } from "@/components/popover"
import { Input } from "@/components/input"

/**
 * Combo Box — quebi design system
 *
 * An autocomplete combo box: a quebi-styled text input paired with a filterable
 * dropdown of options. Built on react-aria-components, it composes the quebi
 * Input for the control and reuses the Dropdown surface/items inside a Popover.
 * Selection and focus read in brand teal via the shared dropdown styling.
 */

interface ComboBoxProps<T extends object> extends Omit<ComboboxPrimitiveProps<T>, "children"> {
  children: React.ReactNode
}

const ComboBox = <T extends object>({ className, ...props }: ComboBoxProps<T>) => {
  return (
    <ComboboxPrimitive
      data-slot="control"
      className={cn("group flex w-full flex-col gap-y-1.5", className)}
      {...props}
    />
  )
}

interface ComboBoxListProps<T extends object>
  extends Omit<ListBoxProps<T>, "layout" | "orientation">,
    Pick<PopoverProps, "placement"> {
  popover?: Omit<PopoverProps, "children">
}

const ComboBoxContent = <T extends object>({
  children,
  items,
  className,
  popover,
  ...props
}: ComboBoxListProps<T>) => {
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
      >
        {children}
      </ListBox>
    </PopoverContent>
  )
}

const ComboBoxInput = (props: PrimitiveInputProps) => {
  const context = useSlottedContext(ComboBoxContext)
  return (
    <span
      data-slot="control"
      className="relative isolate block has-[[data-slot=icon]:last-child]:[&_input]:pe-10"
    >
      <Input {...props} placeholder={props?.placeholder} />
      <Button className="absolute end-0 top-0 grid h-full w-9 cursor-default place-content-center outline-none">
        {!context?.inputValue && (
          <ChevronsUpDown data-slot="icon" className="-me-1 size-4 text-quebi-fg-muted" />
        )}
      </Button>
    </span>
  )
}

const ComboBoxSection = DropdownSection
const ComboBoxItem = DropdownItem
const ComboBoxLabel = DropdownLabel
const ComboBoxDescription = DropdownDescription

export type { ComboBoxListProps, ComboBoxProps }
export {
  ComboBox,
  ComboBoxContent,
  ComboBoxDescription,
  ComboBoxInput,
  ComboBoxItem,
  ComboBoxLabel,
  ComboBoxSection,
}
