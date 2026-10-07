"use client"

import { ChevronsUpDown } from "lucide-react"
import type {
  ListBoxProps,
  PopoverProps,
  SelectProps as SelectPrimitiveProps,
} from "react-aria-components"
import {
  Button,
  composeRenderProps,
  ListBox,
  Select as SelectPrimitive,
  SelectValue,
} from "react-aria-components"
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"
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
 * trigger is drawn like `Input` — underline only, thickened to 2px while
 * focused or open, no ring; the chevron is muted; the options reuse the
 * dropdown surface and items. Foundational — Calendar and Conform Select
 * compose this.
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
      className={composeRenderProps(className, (resolved) => cn("group/select", fieldStyles, resolved))}
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
      className={composeRenderProps(popover?.className, (resolved) =>
        cn(
          "min-w-(--trigger-width) scroll-py-1 overflow-y-auto overscroll-contain",
          resolved,
        ),
      )}
      {...popover}
    >
      <ListBox
        layout="stack"
        orientation="vertical"
        className={composeRenderProps(className, (resolved) =>
          cn(
            "grid max-h-96 w-full grid-cols-[auto_1fr] flex-col gap-y-1 overflow-y-auto p-1 outline-hidden *:[[role='group']+[role=group]]:mt-4 *:[[role='group']+[role=separator]]:mt-1",
            resolved,
          ),
        )}
        items={items}
        {...props}
      />
    </PopoverContent>
  )
}

/**
 * The trigger's size scale — the same three steps `Input` publishes, and for
 * the same reason: a trigger's height is line-height + padding + 1px of border
 * top (transparent) and bottom, so `xs` (30px) and `sm` (38px) line up exactly
 * with `Button`'s `xs` and `sm`. No horizontal padding: the value starts under
 * the label.
 *
 * Spelled out here rather than imported so `Select` does not gain `Input` as a
 * registry dependency for three strings.
 */
const selectTriggerSizeStyles = {
  xs: "text-xs px-(--q-field-px) py-1.5",
  sm: "text-sm px-(--q-field-px) py-2",
  md: "text-sm px-(--q-field-px) py-2.5",
} as const

type SelectTriggerSize = keyof typeof selectTriggerSizeStyles

interface SelectTriggerProps extends Omit<React.ComponentProps<typeof Button>, "size"> {
  prefix?: React.ReactNode
  className?: string
  /**
   * Control height. Matches `Input`'s scale and `Button`'s `xs` / `sm`. Left
   * out, it is whatever the surrounding surface asked for — a table cell being
   * the one that does. See `@/lib/field-size`.
   */
  size?: SelectTriggerSize
}

const SelectTrigger = ({ children, className, size: sizeProp, ...props }: SelectTriggerProps) => {
  const { size } = useFieldSizing({ size: sizeProp })
  return (
    <span data-slot="control" className="relative block w-full">
      <Button
        className={cn(
          // `Input`'s underline: transparent top border so the height is the scale's.
          "group/select-trigger flex w-full min-w-0 cursor-default items-center gap-x-2 text-start text-quebi-fg",
          "quebi-field",
          selectTriggerSizeStyles[size],
          "transition-[border-color,box-shadow] duration-150",
          // focus / open → the underline thickens to 2px, inside the box.
          "outline-none focus:outline-none focus:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
          "group-open/select:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
          "group-invalid/select:border-b-quebi-danger group-invalid/select:focus:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
          // leading icons / loader, muted.
          "*:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-quebi-fg-subtle",
          "*:data-[slot=loader]:size-4 *:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center *:data-[slot=loader]:text-quebi-fg-subtle",
          "group-disabled/select:cursor-not-allowed group-disabled/select:opacity-50",
          "in-disabled:opacity-50",
          className,
        )}
      >
        {(values) => (
          <>
            {props.prefix && <span className="text-quebi-fg-subtle">{props.prefix}</span>}
            {typeof children === "function" ? children(values) : children}

            {!children && (
              <>
                <SelectValue
                  data-slot="select-value"
                  className={cn(
                    "truncate text-start data-placeholder:text-quebi-fg-subtle **:[[slot=description]]:hidden",
                    "has-data-[slot=avatar]:grid has-data-[slot=avatar]:grid-cols-[1fr_auto] has-data-[slot=avatar]:items-center has-data-[slot=avatar]:gap-x-2",
                    "has-data-[slot=icon]:grid has-data-[slot=icon]:grid-cols-[1fr_auto] has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-2",
                    "*:data-[slot=icon]:size-4",
                    "*:mt-0 *:data-[slot=avatar]:[--avatar-size:--spacing(4)]",
                  )}
                />
                <ChevronsUpDown
                  data-slot="chevron"
                  className="ms-auto size-4 shrink-0 text-quebi-fg-subtle"
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

export type { SelectProps, SelectTriggerProps, SelectTriggerSize }
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
