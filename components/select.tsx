import { ChevronUpDownIcon } from "@heroicons/react/20/solid"
import type {
  ListBoxProps,
  PopoverProps,
  SelectProps as SelectPrimitiveProps,
} from "react-aria-components"
import { Button, ListBox, Select as SelectPrimitive, SelectValue } from "react-aria-components"
import { twJoin } from "tailwind-merge"
import { cx } from "@/lib/primitive"
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
  DropdownSection,
  DropdownSeparator,
} from "./dropdown"
import { fieldStyles } from "./field"
import { PopoverContent } from "./popover"

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
      className={cx(fieldStyles({ className: "group/select" }), className)}
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
      className={cx(
        "min-w-(--trigger-width) scroll-py-1 overflow-y-auto overscroll-contain",
        popover?.className,
      )}
      {...popover}
    >
      <ListBox
        layout="stack"
        orientation="vertical"
        className={cx(
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
        className={cx(
          // Cellestial DS .select → matches .input (14px, py-2.5 px-3, ink-200 border, rounded-sm).
          "group/select-trigger flex w-full min-w-0 cursor-default items-center gap-x-2 text-start outline-none",
          "bg-surface border border-ink-200 rounded-sm px-3 py-2.5",
          "font-body! font-normal! text-[14px]! leading-[17px]! text-ink-900!",
          "transition-[border-color,box-shadow] duration-[200ms]",
          // hover: ink-400.
          "enabled:hover:border-ink-400",
          // focus / open: brand-500 border + ring. `!` so they beat hover.
          "focus:border-brand-500! focus:ring-4! focus:ring-brand-100",
          "group-open/select:border-brand-500! group-open/select:ring-4! group-open/select:ring-brand-100",
          // invalid wins over hover/focus via `!` so the red border stays.
          "group-invalid/select:border-danger-500! group-invalid/select:focus:ring-danger-100 group-invalid/select:group-open/select:ring-danger-100",
          // Icons + chevron sized 16px so they don't push the trigger past 39px.
          "*:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-ink-500",
          "*:data-[slot=loader]:size-4 *:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center *:data-[slot=loader]:text-ink-500",
          "group-disabled/select:bg-ink-50 group-disabled/select:opacity-50",
          "in-disabled:bg-ink-50 in-disabled:opacity-50",
          className,
        )}
      >
        {(values) => (
          <>
            {props.prefix && <span className="text-muted-fg">{props.prefix}</span>}
            {typeof children === "function" ? children(values) : children}

            {!children && (
              <>
                <SelectValue
                  data-slot="select-value"
                  className={twJoin([
                    "truncate text-start text-[14px] leading-[17px] data-placeholder:text-ink-400 **:[[slot=description]]:hidden",
                    "has-data-[slot=avatar]:grid has-data-[slot=avatar]:grid-cols-[1fr_auto] has-data-[slot=avatar]:items-center has-data-[slot=avatar]:gap-x-2",
                    "has-data-[slot=icon]:grid has-data-[slot=icon]:grid-cols-[1fr_auto] has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-2",
                    "*:data-[slot=icon]:size-4",
                    "*:mt-0 *:data-[slot=avatar]:[--avatar-size:--spacing(4)]",
                  ])}
                />
                <ChevronUpDownIcon
                  data-slot="chevron"
                  className="ms-auto -me-1 size-4 shrink-0 text-ink-500"
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
