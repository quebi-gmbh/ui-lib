"use client"

import { createContext, use } from "react"
import {
  composeRenderProps,
  Group,
  type GroupProps,
  type SeparatorProps,
  Toolbar as ToolbarPrimitive,
  type ToolbarProps as ToolbarPrimitiveProps,
} from "react-aria-components"
import { Button, type ButtonProps } from "@/components/button"
import { Separator } from "@/components/separator"
import { Toggle, type ToggleProps } from "@/components/toggle"
import { cn } from "@/lib/utils"

/**
 * Toolbar — quebi design system
 *
 * A horizontal or vertical container that groups related controls — actions,
 * toggles and separators — into a single keyboard-navigable surface. Built on
 * react-aria-components for roving-focus and arrow-key navigation.
 *
 * Styled as a quebi surface: a subtle background panel with the signature
 * hairline cyan border and a quebi radius.
 *
 * Two kinds of item, and the choice between them is not cosmetic:
 * `ToolbarItem` is a Toggle, so it has an on state that lights up with brand
 * teal and reports `aria-pressed`. `ToolbarButton` is a Button — Save, Export,
 * Delete — which has no such state, and saying it does would be a lie to a
 * screen reader. Both carry the same size and intent defaults, so a row of
 * either or both lines up.
 *
 * Anything else can go in directly: `children` is unrestricted and react-aria's
 * roving focus picks the control up. Ask it for the same 38px the two items
 * default to — `<SelectTrigger size="sm">`, `<Input size="sm">` — and the row
 * stays one height.
 */

interface ToolbarProps extends ToolbarPrimitiveProps {
  isCircle?: boolean
}

const ToolbarContext = createContext<{
  orientation?: ToolbarProps["orientation"]
  isCircle?: boolean
}>({
  orientation: "horizontal",
  isCircle: false,
})

const Toolbar = ({ orientation = "horizontal", isCircle, className, ...props }: ToolbarProps) => {
  return (
    <ToolbarContext value={{ orientation, isCircle }}>
      <ToolbarPrimitive
        orientation={orientation}
        {...props}
        className={composeRenderProps(className, (className, { orientation }) =>
          cn(
            "group inline-flex gap-1.5 border border-quebi-line/10 bg-quebi-bg p-1.5",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            isCircle ? "rounded-full" : "rounded-quebi-md",
            orientation === "horizontal"
              ? "flex-row items-center"
              : "flex-col items-start",
            className,
          ),
        )}
      />
    </ToolbarContext>
  )
}

const ToolbarGroupContext = createContext<{ isDisabled?: boolean; isCircle?: boolean }>({})

interface ToolbarGroupProps extends GroupProps {}

const ToolbarGroup = ({ isDisabled, className, ...props }: ToolbarGroupProps) => {
  return (
    <ToolbarGroupContext value={{ isDisabled }}>
      <Group
        className={cn(
          "flex gap-1.5",
          "group-orientation-vertical:flex-col group-orientation-vertical:items-start",
          "group-orientation-horizontal:items-center",
          className,
        )}
        {...props}
      >
        {props.children}
      </Group>
    </ToolbarGroupContext>
  )
}

interface ToolbarItemProps extends ToggleProps {}

/**
 * A two-state control in the tray — bold, italic, "show archived". Reach for
 * `ToolbarButton` when the control fires and forgets.
 */
const ToolbarItem = ({
  isDisabled,
  isCircle,
  size = "sm",
  intent = "outline",
  ref,
  className,
  ...props
}: ToolbarItemProps) => {
  const context = use(ToolbarGroupContext)
  const { isCircle: contextCircle } = use(ToolbarContext)
  const effectiveIsDisabled = isDisabled || context.isDisabled
  const effectiveIsCircle = isCircle || contextCircle
  return (
    <Toggle
      intent={intent}
      size={size}
      ref={ref}
      data-slot="toolbar-item"
      isCircle={effectiveIsCircle}
      className={className}
      isDisabled={effectiveIsDisabled}
      {...props}
    />
  )
}

interface ToolbarButtonProps extends ButtonProps {}

/**
 * A plain action in the tray — the same defaults as `ToolbarItem`, minus the
 * pressed state.
 *
 * Without it, a Save or Export button in a toolbar is either a `ToolbarItem`
 * asserting an `aria-pressed` that means nothing, or a bare `Button` hand-sized
 * to match its neighbours — which is where the heights stop agreeing. The
 * defaults are deliberately `ToolbarItem`'s, character for character.
 */
const ToolbarButton = ({
  isDisabled,
  isCircle,
  size = "sm",
  intent = "outline",
  ref,
  className,
  ...props
}: ToolbarButtonProps) => {
  const context = use(ToolbarGroupContext)
  const { isCircle: contextCircle } = use(ToolbarContext)
  const effectiveIsDisabled = isDisabled || context.isDisabled
  const effectiveIsCircle = isCircle || contextCircle
  return (
    <Button
      intent={intent}
      size={size}
      ref={ref}
      data-slot="toolbar-button"
      isCircle={effectiveIsCircle}
      className={className}
      isDisabled={effectiveIsDisabled}
      {...props}
    />
  )
}

type ToolbarSeparatorProps = SeparatorProps

const ToolbarSeparator = ({ className, ...props }: ToolbarSeparatorProps) => {
  const { orientation } = use(ToolbarContext)
  const reverseOrientation = orientation === "vertical" ? "horizontal" : "vertical"
  return (
    <Separator
      orientation={reverseOrientation}
      className={cn(
        reverseOrientation === "vertical" ? "mx-0.5 h-6" : "my-0.5 w-8",
        className,
      )}
      {...props}
    />
  )
}

export type {
  ToolbarButtonProps,
  ToolbarItemProps,
  ToolbarGroupProps,
  ToolbarProps,
  ToolbarSeparatorProps,
}
export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarItem, ToolbarSeparator }
