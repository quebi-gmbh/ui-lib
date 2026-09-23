"use client"

import { Zap } from "lucide-react"
import { use, useSyncExternalStore } from "react"
import type { DialogTriggerProps, MenuProps } from "react-aria-components"
import {
  composeRenderProps,
  DialogTrigger,
  Menu as MenuPrimitive,
  OverlayTriggerStateContext,
} from "react-aria-components"
import { Button, type ButtonProps } from "@/components/button"
import { DrawerContent, DrawerHeader, DrawerTitle } from "@/components/drawer"
import {
  MenuDescription,
  MenuItem,
  type MenuItemProps,
  MenuLabel,
  MenuSection,
  type MenuSectionProps,
  MenuSeparator,
  MenuShortcut,
  menuContentStyles,
} from "@/components/menu"
import { cn } from "@/lib/utils"

/**
 * Quick Actions — quebi design system
 *
 * "Everything you can do from here", in one place: a trigger opens a panel
 * listing the actions on this screen, grouped, and picking one runs it and
 * closes the panel.
 *
 * The question that chooses between this and `CommandMenu` is whether the
 * reader knows what they want. A command menu is keyboard-first search over
 * many commands; Quick Actions is a pointer- and touch-first list of the
 * handful that matter here — so it has no search field, and a list that needs
 * one is a `CommandMenu`.
 *
 * Nothing in it is a new overlay. The panel is a `DrawerContent` — a bottom
 * panel a thumb should be able to throw away is a Drawer, and that is what the
 * narrow-viewport side is — and the list is a react-aria `Menu` built from the
 * library's `MenuItem`/`MenuSection`/`MenuSeparator`, so `role="menu"`, arrow
 * keys, typeahead and `onAction` come from the same code as every other menu.
 *
 * Two triggers, both optional and both usable at once: `QuickActionsTrigger` is
 * a plain Button for a header, and `QuickActionsFab` is a round button fixed to
 * the bottom-right corner, clear of the safe-area inset and one z-layer below
 * the overlays (`z-40` under their `z-50`), for a layout whose header has no
 * room. Focus returns to whichever of them opened the panel.
 */

const QuickActions = (props: DialogTriggerProps) => <DialogTrigger {...props} />

const WIDE_QUERY = "(min-width: 768px)"

const subscribeToWidth = (onChange: () => void) => {
  const mql = window.matchMedia(WIDE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * Bottom on a phone, right on a desktop. The server snapshot is "bottom", and
 * that is safe rather than a guess: the panel renders only while open, so the
 * value never reaches prerendered HTML, and by the time anyone opens it the
 * client snapshot has taken over.
 */
const useAutoSide = (): "bottom" | "right" =>
  useSyncExternalStore(
    subscribeToWidth,
    () => (window.matchMedia(WIDE_QUERY).matches ? "right" : "bottom"),
    () => "bottom",
  )

/**
 * The header trigger. The library's Button, `outline` by default so it sits
 * beside a navbar's links rather than competing with the page's primary action.
 */
const QuickActionsTrigger = ({ intent = "outline", ...props }: ButtonProps) => (
  <Button intent={intent} {...props} />
)

interface QuickActionsFabProps extends ButtonProps {
  /** The FAB is icon-only, so it needs a name. Defaults to "Actions". */
  "aria-label"?: string
}

/**
 * The floating trigger. `fixed` to the viewport's bottom-right, with its
 * offset added to `env(safe-area-inset-*)` so it clears a phone's home
 * indicator and rounded corners; the inset is 0 wherever there is none.
 * Children replace the default icon.
 */
const QuickActionsFab = ({
  className,
  children,
  "aria-label": ariaLabel = "Actions",
  intent = "primary",
  ...props
}: QuickActionsFabProps) => (
  <Button
    aria-label={ariaLabel}
    intent={intent}
    size="sq-lg"
    isCircle
    className={composeRenderProps(className, (resolved) =>
      cn(
        "fixed right-[calc(--spacing(4)+env(safe-area-inset-right))] bottom-[calc(--spacing(4)+env(safe-area-inset-bottom))] z-40 shadow-quebi-glow",
        resolved,
      ),
    )}
    {...props}
  >
    {children ?? <Zap data-slot="icon" aria-hidden />}
  </Button>
)

interface QuickActionsContentProps<T>
  extends Pick<
    MenuProps<T>,
    "children" | "items" | "onAction" | "disabledKeys" | "dependencies"
  > {
  /** The panel's heading and the accessible name of both the dialog and the menu. */
  title?: string
  /** Pin the side. Unset, the panel comes up from the bottom below 768px and in from the right above it. */
  side?: "bottom" | "right"
  /** Controlled open state, for a panel with no `QuickActions` around it. */
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

const QuickActionsContent = <T extends object>({
  title = "Actions",
  side,
  isOpen,
  onOpenChange,
  className,
  ...props
}: QuickActionsContentProps<T>) => {
  const autoSide = useAutoSide()
  const resolvedSide = side ?? autoSide
  return (
    <DrawerContent side={resolvedSide} isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerHeader className="pb-2">
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <QuickActionsList aria-label={title} className={className} {...props} />
    </DrawerContent>
  )
}

/**
 * The Menu, split out so it can read the overlay's state: `Modal` provides
 * `OverlayTriggerStateContext` inside the panel, and a Menu closes through
 * `onClose` after any item's action — the Menu-level `onAction`, an item's own
 * `onAction`, or an `href` — so every way of picking one closes the panel.
 */
const QuickActionsList = <T extends object>({
  className,
  ...props
}: Omit<MenuProps<T>, "className"> & { className?: string }) => {
  const state = use(OverlayTriggerStateContext)
  return (
    <MenuPrimitive
      autoFocus="first"
      onClose={() => state?.close()}
      className={menuContentStyles({
        className: cn(
          "min-h-0 flex-1 overscroll-contain px-2 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] [clip-path:none]",
          className,
        ),
      })}
      {...props}
    />
  )
}

interface QuickActionsItemProps extends Omit<MenuItemProps, "children"> {
  /** The action's name. A string also becomes the item's typeahead text. */
  children: React.ReactNode
  /** A component, not an element: `icon={Trash2}`. It is decorative — the label names the action. */
  icon?: React.ElementType
  description?: React.ReactNode
  /** A shortcut hint, e.g. "⌘N". Shown from `lg` up, like every `Keyboard`. */
  shortcut?: string
}

/**
 * One action. `intent="danger"` for a destructive one, `href` for one that
 * navigates, `isDisabled` for one that is visible but not available.
 */
const QuickActionsItem = ({
  children,
  icon: Icon,
  description,
  shortcut,
  textValue,
  className,
  ...props
}: QuickActionsItemProps) => (
  <MenuItem
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    className={composeRenderProps(className, (resolved) => cn("sm:py-2", resolved))}
    {...props}
  >
    {Icon && <Icon data-slot="icon" aria-hidden />}
    <MenuLabel>{children}</MenuLabel>
    {description && <MenuDescription>{description}</MenuDescription>}
    {shortcut && <MenuShortcut>{shortcut}</MenuShortcut>}
  </MenuItem>
)

/** A group of actions under a heading. `label` is the heading. */
const QuickActionsSection = <T extends object>(props: MenuSectionProps<T>) => (
  <MenuSection {...props} />
)

const QuickActionsSeparator = MenuSeparator

export type { QuickActionsContentProps, QuickActionsFabProps, QuickActionsItemProps }
export {
  QuickActions,
  QuickActionsContent,
  QuickActionsFab,
  QuickActionsItem,
  QuickActionsSection,
  QuickActionsSeparator,
  QuickActionsTrigger,
}
