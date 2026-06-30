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
import { Separator } from "@/components/separator"
import { Toggle, type ToggleProps } from "@/components/toggle"
import { cn } from "@/lib/utils"

/**
 * Toolbar — quebi design system
 *
 * A horizontal or vertical container that groups related actions (toggle
 * buttons, separators) into a single keyboard-navigable surface. Built on
 * react-aria-components for roving-focus and arrow-key navigation.
 *
 * Styled as a quebi surface: a subtle background panel with the signature
 * hairline cyan border and a quebi radius. Items are quebi Toggles, so the
 * active state lights up with brand teal.
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
            "group inline-flex gap-1.5 border border-cyan-500/10 bg-quebi-bg p-1.5",
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

export type { ToolbarItemProps, ToolbarGroupProps, ToolbarProps, ToolbarSeparatorProps }
export { Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator }
