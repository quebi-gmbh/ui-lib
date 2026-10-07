"use client"

import { Check } from "lucide-react"
import type {
  ListBoxItemProps,
  ListBoxSectionProps,
  SeparatorProps,
  TextProps,
} from "react-aria-components"
import {
  Collection,
  composeRenderProps,
  Header,
  ListBoxItem as ListBoxItemPrimitive,
  ListBoxSection,
  Separator,
  Text,
} from "react-aria-components"
import { Keyboard } from "@/components/keyboard"
import { cn, tv } from "@/lib/utils"

/**
 * Dropdown — quebi design system
 *
 * Foundational building blocks shared by Menu, Select, Combo Box, and List Box.
 * These are not a standalone overlay; they render the surface, sections, items,
 * labels, descriptions, separators, and keyboard hints inside any
 * react-aria `ListBox`/`Menu` collection. Rows are square; hover and focus
 * lay `bg-quebi-raised` under them; the selected row is marked by an ink check,
 * not a fill; section headers are eyebrows and separators hairlines.
 */

const dropdownSectionStyles = tv({
  slots: {
    section: "col-span-full grid grid-cols-[auto_1fr]",
    header:
      "col-span-full px-3 pt-3 pb-1.5 quebi-eyebrow sm:px-2.5",
  },
})

const { section, header } = dropdownSectionStyles()

interface DropdownSectionProps<T> extends ListBoxSectionProps<T> {
  title?: string
}

const DropdownSection = <T extends object>({
  className,
  children,
  ...props
}: DropdownSectionProps<T>) => {
  return (
    <ListBoxSection className={section({ className })}>
      {"title" in props && <Header className={header()}>{props.title}</Header>}
      <Collection items={props.items}>{children}</Collection>
    </ListBoxSection>
  )
}

const dropdownItemStyles = tv({
  base: [
    "min-w-0 [--me-icon:--spacing(2.5)] sm:[--me-icon:--spacing(2)]",
    "col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] px-3 py-2 supports-[grid-template-columns:subgrid]:grid-cols-subgrid sm:px-2.5 sm:py-1.5",
    "not-has-[[slot=description]]:items-center",
    "group relative cursor-default select-none rounded-none outline-0",
    // text — 14/20 Inter in ink.
    "text-sm/5 text-quebi-fg forced-colors:text-[CanvasText]",
    // avatar
    "*:data-[slot=avatar]:*:me-(--me-icon) *:data-[slot=avatar]:me-(--me-icon) has-[[slot=description]]:*:data-[slot=avatar]:row-span-2 *:data-[slot=avatar]:[--avatar-size:--spacing(5)] sm:*:data-[slot=avatar]:[--avatar-size:--spacing(4)]",
    // icon
    "*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:-ms-0.5 *:data-[slot=icon]:me-(--me-icon) *:data-[slot=icon]:shrink-0 [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-fg-muted",
    "not-has-[[slot=description]]:*:data-[slot=icon]:size-5 sm:not-has-[[slot=description]]:*:data-[slot=icon]:size-4",
    "has-[[slot=description]]:*:data-[slot=icon]:h-lh has-[[slot=description]]:[&_[data-slot='icon']:not([class*='w-'])]:w-5 sm:has-[[slot=description]]:[&_[data-slot='icon']:not([class*='w-'])]:w-4",
    "[&>[slot=label]+[data-slot=icon]]:absolute [&>[slot=label]+[data-slot=icon]]:end-0 [&>[slot=label]+[data-slot=icon]]:top-1",
    "selected:[&>[data-slot=icon]:has(+[data-slot=icon])]:absolute selected:[&>[data-slot=icon]:has(+[data-slot=icon])]:end-0 selected:[&>[data-slot=icon]:has(+[data-slot=icon])]:top-1",
    "selected:[&>[data-slot=icon]:has(+[data-slot=avatar])]:absolute selected:[&>[data-slot=icon]:has(+[data-slot=avatar])]:end-0 selected:[&>[data-slot=icon]:has(+[data-slot=avatar])]:top-1",
    "selected:[&>[data-slot=avatar]+[data-slot=icon]+[slot=label]]:me-6 selected:[&>[data-slot=avatar]+[slot=label]]:me-6 selected:[&>[data-slot=icon]+[data-slot=avatar]+[slot=label]]:me-6 selected:[&>[data-slot=icon]+[slot=label]]:me-6",
    // keyboard
    "*:data-[slot=keyboard]:end-3",
    // force color adjust
    "forced-color-adjust-none forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText] forced-colors:focus:*:data-[slot=icon]:text-[HighlightText]",
  ],
  variants: {
    intent: {
      danger: [
        "text-quebi-danger focus:text-quebi-danger [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-danger/70",
        "*:[[slot=description]]:text-quebi-danger/80 focus:*:[[slot=description]]:text-quebi-danger focus:*:[[slot=label]]:text-quebi-danger",
        "focus:bg-quebi-danger/10 focus:text-quebi-danger forced-colors:focus:text-[Mark] focus:[&_[data-slot='icon']:not([class*='text-'])]:text-quebi-danger",
        "*:data-[slot=keyboard]:text-quebi-danger/70 focus:*:data-[slot=keyboard]:text-quebi-danger",
      ],
      warning: [
        "text-quebi-warn focus:text-quebi-warn [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-warn/70",
        "*:[[slot=description]]:text-quebi-warn/80 focus:*:[[slot=description]]:text-quebi-warn focus:*:[[slot=label]]:text-quebi-warn",
        "focus:bg-quebi-warn/10 focus:text-quebi-warn focus:[&_[data-slot='icon']:not([class*='text-'])]:text-quebi-warn",
        "*:data-[slot=keyboard]:text-quebi-warn/70 focus:*:data-[slot=keyboard]:text-quebi-warn",
      ],
    },
    isDisabled: {
      true: "opacity-50 forced-colors:text-[GrayText]",
    },
    isSelected: {
      // Selected → the ink check mark (rendered by the item) and a heavier
      // label. No fill: a fill would read as focus.
      true: "font-medium text-quebi-fg [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-fg",
    },
    isFocused: {
      // Keyboard-focused → the same `raised` ground as hover.
      true: [
        "*:data-[slot=keyboard]:text-quebi-fg [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-fg",
        "bg-quebi-raised text-quebi-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
        "*:[[slot=description]]:text-quebi-fg *:[[slot=label]]:text-quebi-fg",
      ],
    },
    isHovered: {
      true: [
        "*:data-[slot=keyboard]:text-quebi-fg [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-fg",
        "bg-quebi-raised text-quebi-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
        "*:[[slot=description]]:text-quebi-fg *:[[slot=label]]:text-quebi-fg",
      ],
    },
  },
})

interface DropdownItemProps extends ListBoxItemProps {
  intent?: "danger" | "warning"
}

const DropdownItem = ({ className, children, intent, ...props }: DropdownItemProps) => {
  const textValue = typeof children === "string" ? children : undefined
  return (
    <ListBoxItemPrimitive
      textValue={textValue}
      className={composeRenderProps(className, (className, renderProps) =>
        dropdownItemStyles({ ...renderProps, intent, className }),
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected }) => (
        <>
          {isSelected && (
            <Check
              className={cn(
                "-ms-0.5 me-1.5 h-lh w-4 shrink-0",
                "group-has-data-[slot=icon]:absolute group-has-data-[slot=icon]:end-0.5 group-has-data-[slot=icon]:top-1/2 group-has-data-[slot=icon]:-translate-y-1/2",
                "group-has-data-[slot=avatar]:absolute group-has-data-[slot=avatar]:end-0.5 group-has-data-[slot=avatar]:top-1/2 group-has-data-[slot=avatar]:-translate-y-1/2",
              )}
              data-slot="check-indicator"
            />
          )}
          {typeof children === "string" ? <DropdownLabel>{children}</DropdownLabel> : children}
        </>
      ))}
    </ListBoxItemPrimitive>
  )
}

const DropdownLabel = ({ className, ...props }: TextProps) => (
  <Text
    slot="label"
    className={cn("col-start-2 [&:has(+[data-slot=icon])]:pe-6", className)}
    {...props}
  />
)

const DropdownDescription = ({ className, ...props }: TextProps) => (
  <Text
    slot="description"
    className={cn("col-start-2 font-normal text-quebi-fg-muted text-sm", className)}
    {...props}
  />
)

const DropdownSeparator = ({ className, ...props }: Omit<SeparatorProps, "orientation">) => (
  <Separator
    orientation="horizontal"
    className={cn("col-span-full -mx-1 my-1 h-px bg-quebi-hairline", className)}
    {...props}
  />
)

const DropdownKeyboard = ({ className, ...props }: React.ComponentProps<typeof Keyboard>) => {
  return (
    <Keyboard
      className={cn(
        "absolute end-2 ps-2 group-hover:text-quebi-fg group-focus:text-quebi-fg",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Note: This is not an exposed standalone component, but it's used in other
 * components (Menu, Select, Combo Box, List Box) to render dropdown surfaces.
 * @internal
 */
export type { DropdownItemProps, DropdownSectionProps }
export {
  DropdownDescription,
  DropdownItem,
  DropdownKeyboard,
  DropdownLabel,
  DropdownSection,
  DropdownSeparator,
  dropdownItemStyles,
  dropdownSectionStyles,
}
