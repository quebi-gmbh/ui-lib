"use client"

import { Check, ChevronRight } from "lucide-react"
import type {
  ButtonProps,
  MenuItemProps as MenuItemPrimitiveProps,
  MenuProps as MenuPrimitiveProps,
  MenuSectionProps as MenuSectionPrimitiveProps,
  MenuTriggerProps as MenuTriggerPrimitiveProps,
} from "react-aria-components"
import {
  Button,
  Collection,
  composeRenderProps,
  Header,
  MenuItem as MenuItemPrimitive,
  Menu as MenuPrimitive,
  MenuSection as MenuSectionPrimitive,
  MenuTrigger as MenuTriggerPrimitive,
  SubmenuTrigger as SubmenuTriggerPrimitive,
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import {
  DropdownDescription,
  DropdownKeyboard,
  DropdownLabel,
  DropdownSeparator,
  dropdownItemStyles,
  dropdownSectionStyles,
} from "@/components/dropdown"
import { PopoverContent, type PopoverContentProps } from "@/components/popover"
import { cn } from "@/lib/utils"

/**
 * Menu — quebi design system
 *
 * A trigger-anchored action menu built on react-aria-components and composed from
 * the Popover overlay and the shared Dropdown item styling. Supports sections,
 * separators, keyboard shortcuts, selection indicators, danger/warning intents,
 * and nested submenus. Foundational — command-menu and context-menu compose this.
 *
 * Surface: the dark quebi-bg popover with cyan hairlines; items reuse the
 * dropdown item styling (brand-teal selection, subtle white hover/focus wash).
 */

const Menu = (props: MenuTriggerPrimitiveProps) => <MenuTriggerPrimitive {...props} />

const MenuSubMenu = ({ delay = 0, ...props }: React.ComponentProps<typeof SubmenuTriggerPrimitive>) => (
  <SubmenuTriggerPrimitive {...props} delay={delay}>
    {props.children}
  </SubmenuTriggerPrimitive>
)

interface MenuTriggerProps extends ButtonProps {
  ref?: React.Ref<HTMLButtonElement>
}

const MenuTrigger = ({ className, ref, ...props }: MenuTriggerProps) => (
  <Button
    ref={ref}
    data-slot="menu-trigger"
    className={cn(
      "relative inline text-start outline-hidden",
      "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
      "*:data-[slot=chevron]:size-5 sm:*:data-[slot=chevron]:size-4",
      className,
    )}
    {...props}
  />
)

interface MenuContentProps<T>
  extends MenuPrimitiveProps<T>,
    Pick<PopoverContentProps, "placement"> {
  className?: string
  popover?: Pick<
    PopoverContentProps,
    | "arrow"
    | "className"
    | "placement"
    | "offset"
    | "crossOffset"
    | "arrowBoundaryOffset"
    | "triggerRef"
    | "isOpen"
    | "onOpenChange"
    | "shouldFlip"
  >
}

const menuContentStyles = tv({
  base: "grid max-h-[inherit] grid-cols-[auto_1fr] gap-y-1 overflow-y-auto overflow-x-hidden overscroll-contain p-1 outline-hidden [clip-path:inset(0_0_0_0_round_calc(var(--radius-quebi-md)-(--spacing(1))))] [&>[data-slot=menu-section]+[data-slot=menu-section]:not([class*='mt-']):not([class*='my-'])]:mt-3",
})

const MenuContent = <T extends object>({
  className,
  placement,
  popover,
  ...props
}: MenuContentProps<T>) => {
  return (
    <PopoverContent
      className={cn("min-w-32 *:data-[slot=popover-inner]:overflow-hidden", popover?.className)}
      placement={placement}
      {...popover}
    >
      <MenuPrimitive
        data-slot="menu-content"
        className={menuContentStyles({ className })}
        {...props}
      />
    </PopoverContent>
  )
}

interface MenuItemProps extends MenuItemPrimitiveProps, VariantProps<typeof dropdownItemStyles> {}

const MenuItem = ({ className, intent, children, ...props }: MenuItemProps) => {
  const textValue = props.textValue || (typeof children === "string" ? children : undefined)
  return (
    <MenuItemPrimitive
      data-slot="menu-item"
      className={composeRenderProps(className, (className, { hasSubmenu, ...renderProps }) =>
        dropdownItemStyles({
          ...renderProps,
          intent,
          className: hasSubmenu
            ? cn(
                // Open-submenu state — match the hovered / focused state from
                // dropdownItemStyles so an expanded parent reads as active.
                intent === "danger" &&
                  "open:bg-red-500/10 open:text-red-400 open:[&_[data-slot='icon']:not([class*='text-'])]:text-red-400",
                intent === "warning" &&
                  "open:bg-amber-500/10 open:text-amber-400 open:[&_[data-slot='icon']:not([class*='text-'])]:text-amber-400",
                intent === undefined &&
                  "open:bg-white/[0.04] open:text-white open:[&_[data-slot='icon']:not([class*='text-'])]:text-white",
                className,
              )
            : className,
        }),
      )}
      textValue={textValue}
      {...props}
    >
      {(values) => (
        <>
          {values.isSelected && ["single", "multiple"].includes(values.selectionMode) && (
            <Check data-slot="icon" />
          )}

          {typeof children === "function" ? children(values) : children}

          {values.hasSubmenu && (
            <ChevronRight data-slot="chevron" className="absolute end-2 size-3.5" />
          )}
        </>
      )}
    </MenuItemPrimitive>
  )
}

export interface MenuHeaderProps extends React.ComponentProps<typeof Header> {
  separator?: boolean
}

const MenuHeader = ({ className, separator = false, ...props }: MenuHeaderProps) => (
  <Header
    className={cn(
      "col-span-full px-2.5 py-2 font-medium text-base text-white sm:text-sm",
      separator && "-mx-1 border-cyan-500/10 border-b sm:px-3 sm:pb-2.5",
      className,
    )}
    {...props}
  />
)

const { section, header } = dropdownSectionStyles()

interface MenuSectionProps<T> extends MenuSectionPrimitiveProps<T> {
  ref?: React.Ref<HTMLDivElement>
  label?: string
}

const MenuSection = <T extends object>({
  className,
  children,
  ref,
  ...props
}: MenuSectionProps<T>) => {
  return (
    <MenuSectionPrimitive
      data-slot="menu-section"
      ref={ref}
      className={section({ className })}
      {...props}
    >
      {"label" in props && <Header className={header()}>{props.label}</Header>}
      <Collection items={props.items}>{children}</Collection>
    </MenuSectionPrimitive>
  )
}

const MenuSeparator = DropdownSeparator
const MenuShortcut = DropdownKeyboard
const MenuLabel = DropdownLabel
const MenuDescription = DropdownDescription

export type { MenuContentProps, MenuItemProps, MenuSectionProps, MenuTriggerProps }
export {
  Menu,
  MenuContent,
  MenuDescription,
  MenuHeader,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
  MenuShortcut,
  MenuSubMenu,
  MenuTrigger,
  menuContentStyles,
}
