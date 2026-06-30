"use client"

import { ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon } from "lucide-react"
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  ButtonProps,
  DisclosureGroupProps,
  DisclosurePanelProps,
  DisclosureProps,
  LinkProps,
  LinkRenderProps,
  ModalOverlayProps,
  SeparatorProps as SidebarSeparatorProps,
} from "react-aria-components"
import {
  composeRenderProps,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Header,
  Heading,
  Modal,
  ModalOverlay,
  Separator,
  Text,
  Button as Trigger,
} from "react-aria-components"
import { Button } from "@/components/button"
import { Link } from "@/components/link"
import { Tooltip, TooltipContent } from "@/components/tooltip"
import { cn } from "@/lib/utils"

/**
 * Sidebar — quebi design system
 *
 * A full-featured, collapsible navigation surface built on
 * react-aria-components. The surface sits on `bg-quebi-bg` with the signature
 * cyan hairline border; the active item is highlighted with the brand teal.
 *
 * Compose a `SidebarProvider` around a `Sidebar` (containing `SidebarHeader`,
 * `SidebarContent` with `SidebarSection`/`SidebarItem`, and `SidebarFooter`)
 * and a `SidebarInset` for the main content. Supports docked/hidden collapse,
 * float and inset intents, disclosure groups, badges, tooltips, and a keyboard
 * shortcut to toggle.
 */

const SIDEBAR_WIDTH = "17rem"
const SIDEBAR_WIDTH_DOCK = "3.25rem"
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// Small inline mobile detector so the component stays self-contained.
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return isMobile
}

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  isOpenOnMobile: boolean
  setIsOpenOnMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

const useSidebar = () => {
  const context = use(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  isOpen?: boolean
  shortcut?: string
  onOpenChange?: (open: boolean) => void
}

const SidebarProvider = ({
  defaultOpen = true,
  isOpen: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  shortcut = "b",
  ref,
  ...props
}: SidebarProviderProps) => {
  const [openMobile, setOpenMobile] = useState(false)

  const [internalOpenState, setInternalOpenState] = useState(defaultOpen)
  const open = openProp ?? internalOpenState
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value

      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        setInternalOpenState(openState)
      }

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open],
  )

  const isMobile = useIsMobile()
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile

  const toggleSidebar = useCallback(() => {
    if (isMobileRef.current) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [setOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === shortcut && (event.metaKey || event.ctrlKey)) {
        const activeElement = document.activeElement

        const isInTextInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute("contenteditable") === "true" ||
          activeElement?.getAttribute("role") === "textbox"

        if (!isInTextInput) {
          event.preventDefault()
          toggleSidebar()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar, shortcut])

  const state = open ? "expanded" : "collapsed"

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile: isMobile ?? false,
      isOpenOnMobile: openMobile,
      setIsOpenOnMobile: setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  )

  if (isMobile === undefined) {
    return null
  }

  return (
    <SidebarContext value={contextValue}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-dock": SIDEBAR_WIDTH_DOCK,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "@container **:data-[slot=icon]:shrink-0",
          "flex w-full text-white",
          "group/sidebar-root peer/sidebar-root has-data-[intent=inset]:bg-quebi-bg",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </SidebarContext>
  )
}

// Self-contained mobile overlay (replaces the Cellestial Sheet on mobile).
interface SidebarMobileProps extends Omit<ModalOverlayProps, "children"> {
  side?: "left" | "right"
  children?: React.ReactNode
}

const SidebarMobile = ({ side = "left", className, children, ...props }: SidebarMobileProps) => {
  return (
    <ModalOverlay
      isDismissable
      className="entering:fade-in exiting:fade-out fixed inset-0 z-50 size-full overflow-hidden bg-black/60 entering:animate-in exiting:animate-out entering:duration-300 exiting:duration-200"
      {...props}
    >
      <Modal
        data-slot="sidebar"
        data-intent="default"
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 z-50 flex w-(--sidebar-width) flex-col bg-quebi-bg text-white [--sidebar-width:18rem]",
          "border-cyan-500/10 transition will-change-transform",
          side === "left" &&
            "left-0 border-r entering:slide-in-from-left exiting:slide-out-to-left",
          side === "right" &&
            "right-0 border-l entering:slide-in-from-right exiting:slide-out-to-right",
          "entering:animate-in exiting:animate-out entering:duration-300 exiting:duration-200",
          className,
        )}
      >
        {children}
      </Modal>
    </ModalOverlay>
  )
}

interface SidebarProps extends React.ComponentProps<"div"> {
  intent?: "default" | "float" | "inset"
  collapsible?: "hidden" | "dock" | "none"
  side?: "left" | "right"
  closeButton?: boolean
}

const Sidebar = ({
  children,
  closeButton = true,
  collapsible = "hidden",
  side = "left",
  intent = "default",
  className,
  ...props
}: SidebarProps) => {
  const { isMobile, state, isOpenOnMobile, setIsOpenOnMobile } = useSidebar()
  if (collapsible === "none") {
    return (
      <div
        data-intent={intent}
        data-collapsible="none"
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-quebi-bg text-white",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <span className="sr-only" aria-hidden data-intent={intent} />
        <SidebarMobile isOpen={isOpenOnMobile} onOpenChange={setIsOpenOnMobile} side={side}>
          {children}
        </SidebarMobile>
      </>
    )
  }

  return (
    <div
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-intent={intent}
      data-side={side}
      data-slot="sidebar"
      className="group peer hidden text-white md:block"
      {...props}
    >
      <div
        data-slot="sidebar-gap"
        aria-hidden="true"
        className={cn([
          "w-(--sidebar-width) group-data-[collapsible=hidden]:w-0",
          "group-data-[side=right]:rotate-180",
          "relative h-svh bg-transparent transition-[width] duration-200 ease-linear",
          intent === "default" && "group-data-[collapsible=dock]:w-(--sidebar-width-dock)",
          intent === "float" &&
            "group-data-[collapsible=dock]:w-[calc(var(--sidebar-width-dock)+--spacing(4))]",
          intent === "inset" &&
            "group-data-[collapsible=dock]:w-[calc(var(--sidebar-width-dock)+--spacing(2))]",
        ])}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden w-(--sidebar-width) bg-quebi-bg not-has-data-[slot=sidebar-footer]:pb-2 md:flex",
          "transition-[left,right,width] duration-200 ease-linear",
          side === "left" &&
            "left-0 group-data-[collapsible=hidden]:left-[calc(var(--sidebar-width)*-1)]",
          side === "right" &&
            "right-0 group-data-[collapsible=hidden]:right-[calc(var(--sidebar-width)*-1)]",
          intent === "float" &&
            "bg-quebi-bg p-2 group-data-[collapsible=dock]:w-[calc(--spacing(4)+2px)]",
          intent === "inset" &&
            "group-data-[collapsible=dock]:w-[calc(var(--sidebar-width-dock)+--spacing(2)+2px)]",
          intent === "default" && [
            "group-data-[collapsible=dock]:w-(--sidebar-width-dock)",
            "border-cyan-500/10 group-data-[side=left]:border-r group-data-[side=right]:border-l",
          ],
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="default"
          data-slot="sidebar-inner"
          className={cn(
            "flex h-full w-full flex-col text-white",
            "group-data-[intent=float]:rounded-quebi-md group-data-[intent=float]:border group-data-[intent=float]:border-cyan-500/10 group-data-[intent=float]:bg-quebi-bg group-data-[intent=float]:shadow-quebi-glow",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const SidebarHeader = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  const { state } = useSidebar()
  return (
    <div
      ref={ref}
      data-slot="sidebar-header"
      className={cn(
        "flex flex-col gap-2 p-2.5 [.border-b]:border-cyan-500/10",
        "in-data-[intent=inset]:p-4",
        state === "collapsed" ? "items-center p-2.5" : "p-4",
        className,
      )}
      {...props}
    />
  )
}

const SidebarFooter = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn([
        "mt-auto flex shrink-0 items-center justify-center p-4 **:data-[slot=chevron]:text-quebi-fg-muted",
        "in-data-[intent=inset]:px-6 in-data-[intent=inset]:py-4",
        className,
      ])}
      {...props}
    />
  )
}

const SidebarContent = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { state } = useSidebar()
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 scroll-mb-96 flex-col overflow-auto *:data-[slot=sidebar-section]:border-l-0",
        state === "collapsed" ? "items-center" : "mask-b-from-95%",
        className,
      )}
      {...props}
    >
      {props.children}
    </div>
  )
}

const SidebarSectionGroup = ({ className, ...props }: React.ComponentProps<"section">) => {
  const { state, isMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  return (
    <section
      data-slot="sidebar-section-group"
      className={cn(
        "flex w-full min-w-0 flex-col gap-y-0.5",
        collapsed && "items-center justify-center",
        className,
      )}
      {...props}
    />
  )
}

interface SidebarSectionProps extends React.ComponentProps<"div"> {
  label?: string
}

const SidebarSection = ({ className, ...props }: SidebarSectionProps) => {
  const { state } = useSidebar()
  return (
    <div
      data-slot="sidebar-section"
      className={cn(
        "col-span-full flex min-w-0 flex-col gap-y-0.5 **:data-[slot=sidebar-section]:**:gap-y-0",
        "in-data-[state=collapsed]:p-2 px-4 py-2",
        className,
      )}
      {...props}
    >
      {state !== "collapsed" && "label" in props && (
        <Header className="mb-1 flex shrink-0 items-center rounded-quebi-sm px-2 text-quebi-fg-muted text-xs/6 outline-none ring-quebi-brand/50 transition-[margin,opa] duration-200 ease-linear *:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 group-data-[collapsible=dock]:-mt-8 group-data-[collapsible=dock]:opacity-0">
          {props.label}
        </Header>
      )}
      <div
        data-slot="sidebar-section-inner"
        className="grid grid-cols-[auto_1fr] gap-y-0.5 in-data-[state=collapsed]:gap-y-1.5 *:data-[slot=control]:col-span-full"
      >
        {props.children}
      </div>
    </div>
  )
}

interface SidebarItemProps extends Omit<React.ComponentProps<typeof Link>, "children"> {
  isCurrent?: boolean
  children?:
    | React.ReactNode
    | ((
        values: LinkRenderProps & { defaultChildren: React.ReactNode; isCollapsed: boolean },
      ) => React.ReactNode)
  badge?: string | number | undefined
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
}

const SidebarItem = ({
  isCurrent,
  tooltip,
  children,
  badge,
  className,
  ref,
  ...props
}: SidebarItemProps) => {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const link = (
    <Link
      ref={ref}
      data-slot="sidebar-item"
      aria-current={isCurrent ? "page" : undefined}
      className={composeRenderProps(
        className,
        (className, { isPressed, isFocusVisible, isHovered, isDisabled }) =>
          cn([
            "href" in props ? "cursor-pointer" : "cursor-default",
            "w-full min-w-0 items-center rounded-quebi-sm text-start font-medium text-base/6 text-white no-underline hover:no-underline",
            "group/sidebar-item relative col-span-full overflow-hidden focus-visible:outline-hidden",
            "grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] **:last:data-[slot=icon]:ms-auto supports-[grid-template-columns:subgrid]:grid-cols-subgrid sm:text-sm/5",
            "p-2 has-[a]:p-0",
            // icon
            "**:data-[slot=icon]:shrink-0 [&_[data-slot='icon']:not([class*='size-'])]:size-5 sm:[&_[data-slot='icon']:not([class*='size-'])]:size-4 [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-fg-muted",
            "**:last:data-[slot=icon]:size-5 sm:**:last:data-[slot=icon]:size-4",
            "[&:has([data-slot=icon]+[data-slot=sidebar-label])_[data-slot=icon]:has(+[data-slot=sidebar-label])]:me-2",

            // avatar
            "**:data-[slot=avatar]:[--avatar-size:--spacing(5)]",
            "[&:has([data-slot=avatar]+[data-slot=sidebar-label])_[data-slot=avatar]:has(+[data-slot=sidebar-label])]:me-2",
            isCurrent &&
              "font-medium bg-quebi-brand/10 text-quebi-brand hover:bg-quebi-brand/10 hover:text-quebi-brand [&_.text-muted-fg]:text-quebi-brand/80 [&_[data-slot='icon']:not([class*='text-'])]:text-quebi-brand hover:[&_[data-slot='icon']:not([class*='text-'])]:text-quebi-brand",
            isFocusVisible &&
              "outline-hidden ring-2 ring-quebi-brand/50 ring-inset",
            (isPressed || isHovered) &&
              "bg-white/[0.04] text-white [&_[data-slot='icon']:not([class*='text-'])]:text-white",
            isDisabled && "opacity-50",
            className,
          ]),
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function" ? children({ ...values, isCollapsed }) : children}

          {badge &&
            (state !== "collapsed" ? (
              <span
                data-slot="sidebar-badge"
                className="absolute inset-ring-1 inset-ring-cyan-500/10 inset-y-1/2 end-1.5 h-5.5 w-auto -translate-y-1/2 rounded-full bg-white/5 px-2 text-[10px]/5.5 group-hover/sidebar-item:inset-ring-quebi-fg-muted/30 group-current:inset-ring-transparent"
              >
                {badge}
              </span>
            ) : (
              <div
                aria-hidden
                className="absolute end-1 top-1 size-1.5 rounded-full bg-quebi-brand"
              />
            ))}
        </>
      )}
    </Link>
  )
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip delay={0}>
      {link}
      <TooltipContent
        className="**:data-[slot=icon]:hidden **:data-[slot=sidebar-label-mask]:hidden"
        placement="right"
        arrow
        hidden={!isCollapsed || isMobile || !tooltip}
        {...tooltip}
      />
    </Tooltip>
  )
}

interface SidebarLinkProps extends LinkProps {
  ref?: React.RefObject<HTMLAnchorElement>
}

const SidebarLink = ({ className, ref, ...props }: SidebarLinkProps) => {
  return (
    <Link
      ref={ref}
      className={cn(
        "col-span-full min-w-0 shrink-0 items-center p-2 focus:outline-hidden",
        "grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] supports-[grid-template-columns:subgrid]:grid-cols-subgrid",
        className,
      )}
      {...props}
    />
  )
}

const SidebarInset = ({ className, ref, ...props }: React.ComponentProps<"main">) => {
  return (
    <main
      data-slot="sidebar-inset"
      ref={ref}
      className={cn(
        "relative flex w-full flex-1 flex-col bg-quebi-bg lg:min-w-0",
        "group-has-data-[intent=inset]/sidebar-root:border group-has-data-[intent=inset]/sidebar-root:border-cyan-500/10 group-has-data-[intent=inset]/sidebar-root:bg-quebi-bg",
        "md:group-has-data-[intent=inset]/sidebar-root:m-2",
        "md:group-has-data-[side=left]:group-has-data-[intent=inset]/sidebar-root:ms-0",
        "md:group-has-data-[side=right]:group-has-data-[intent=inset]/sidebar-root:me-0",
        "md:group-has-data-[intent=inset]/sidebar-root:rounded-quebi-lg",
        "md:group-has-data-[intent=inset]/sidebar-root:peer-data-[state=collapsed]:ms-2",
        className,
      )}
      {...props}
    />
  )
}

type SidebarDisclosureGroupProps = DisclosureGroupProps
const SidebarDisclosureGroup = ({
  allowsMultipleExpanded = true,
  className,
  ...props
}: SidebarDisclosureGroupProps) => {
  return (
    <DisclosureGroup
      data-slot="sidebar-disclosure-group"
      allowsMultipleExpanded={allowsMultipleExpanded}
      className={cn(
        "col-span-full flex min-w-0 flex-col gap-y-0.5 in-data-[state=collapsed]:gap-y-1.5",
        className,
      )}
      {...props}
    />
  )
}

interface SidebarDisclosureProps extends DisclosureProps {
  ref?: React.Ref<HTMLDivElement>
}

const SidebarDisclosure = ({ className, ref, ...props }: SidebarDisclosureProps) => {
  return (
    <Disclosure
      ref={ref}
      data-slot="sidebar-disclosure"
      className={cn("col-span-full min-w-0", className)}
      {...props}
    />
  )
}

interface SidebarDisclosureTriggerProps extends ButtonProps {
  ref?: React.Ref<HTMLButtonElement>
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
}

const SidebarDisclosureTrigger = ({
  className,
  ref,
  tooltip,
  ...props
}: SidebarDisclosureTriggerProps) => {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const trigger = (
    <Heading level={3}>
      <Trigger
        ref={ref}
        slot="trigger"
        className={composeRenderProps(
          className,
          (className, { isPressed, isFocusVisible, isHovered, isDisabled }) =>
            cn(
              "flex w-full min-w-0 items-center rounded-quebi-sm text-start font-medium text-base/6 text-white",
              "group/sidebar-disclosure-trigger relative col-span-full overflow-hidden focus-visible:outline-hidden",
              "**:data-[slot=icon]:size-5 **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:text-quebi-fg-muted sm:**:data-[slot=icon]:size-4",
              "**:last:data-[slot=icon]:size-5 sm:**:last:data-[slot=icon]:size-4",
              "**:data-[slot=avatar]:size-6 sm:**:data-[slot=avatar]:size-5",
              "col-span-full gap-3 p-2 **:data-[slot=chevron]:text-quebi-fg-muted **:last:data-[slot=icon]:ms-auto sm:gap-2 sm:text-sm/5",
              isCollapsed && "justify-center",

              isFocusVisible && "outline-hidden ring-2 ring-quebi-brand/50 ring-inset",
              (isPressed || isHovered) &&
                "bg-white/[0.04] text-white **:data-[slot=chevron]:text-white **:data-[slot=icon]:text-white **:last:data-[slot=icon]:text-white",
              isDisabled && "opacity-50",
              className,
            ),
        )}
        {...props}
      >
        {(values) => (
          <>
            {typeof props.children === "function" ? props.children(values) : props.children}
            <ChevronDownIcon
              data-slot="chevron"
              className={cn(
                "z-10 size-3.5 group-aria-expanded/sidebar-disclosure-trigger:hidden",
                !isCollapsed && "ms-auto",
              )}
            />
            <ChevronUpIcon
              data-slot="chevron"
              className={cn(
                "z-10 hidden size-3.5 group-aria-expanded/sidebar-disclosure-trigger:block",
                !isCollapsed && "ms-auto",
              )}
            />
          </>
        )}
      </Trigger>
    </Heading>
  )
  if (typeof tooltip === "string") {
    tooltip = { children: tooltip }
  }
  return (
    <Tooltip delay={0}>
      {trigger}
      <TooltipContent
        className="**:data-[slot=icon]:hidden **:data-[slot=sidebar-label-mask]:hidden"
        placement="right"
        arrow
        hidden={!isCollapsed || isMobile || !tooltip}
        {...tooltip}
      />
    </Tooltip>
  )
}

const SidebarDisclosurePanel = ({ className, ...props }: DisclosurePanelProps) => {
  return (
    <DisclosurePanel
      data-slot="sidebar-disclosure-panel"
      className={cn(
        "h-(--disclosure-panel-height) overflow-clip transition-[height] duration-200",
        className,
      )}
      {...props}
    >
      <div
        data-slot="sidebar-disclosure-panel-content"
        className="col-span-full grid grid-cols-[auto_1fr] gap-y-0.5"
      >
        {props.children}
      </div>
    </DisclosurePanel>
  )
}

const SidebarSeparator = ({ className, ...props }: SidebarSeparatorProps) => {
  return (
    <Separator
      data-slot="sidebar-separator"
      orientation="horizontal"
      className={cn(
        "mx-auto h-px w-[calc(var(--sidebar-width)---spacing(10))] border-0 bg-cyan-500/10 forced-colors:bg-[ButtonBorder]",
        className,
      )}
      {...props}
    />
  )
}

const SidebarTrigger = ({
  onPress,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      aria-label={props["aria-label"] || "Toggle Sidebar"}
      data-slot="sidebar-trigger"
      intent={props.intent || "ghost"}
      size={props.size || "sq-sm"}
      className={cn("shrink-0", className)}
      onPress={(event) => {
        onPress?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {children || (
        <>
          <svg
            aria-hidden="true"
            data-slot="icon"
            className="size-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            width={16}
            height={16}
            fill="currentcolor"
          >
            <path d="M13.25 2.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25H7.5V15h5.75A2.75 2.75 0 0 0 16 12.25v-8.5A2.75 2.75 0 0 0 13.25 1H7.5v1.5zM5.75 1a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-3A2.75 2.75 0 0 1 0 12.25v-8.5A2.75 2.75 0 0 1 2.75 1z" />
          </svg>
          <span className="sr-only">Toggle Sidebar</span>
        </>
      )}
    </Button>
  )
}

const SidebarRail = ({ className, ref, ...props }: React.ComponentProps<"button">) => {
  const { toggleSidebar } = useSidebar()

  return !props.children ? (
    <button
      ref={ref}
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      title="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 outline-hidden transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 hover:after:bg-transparent group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=hidden]:translate-x-0 group-data-[collapsible=hidden]:hover:bg-white/[0.04] group-data-[collapsible=hidden]:after:left-full",
        "[[data-side=left][data-collapsible=hidden]_&]:-right-2 [[data-side=right][data-collapsible=hidden]_&]:-left-2",
        className,
      )}
      {...props}
    />
  ) : (
    props.children
  )
}

const SidebarLabel = ({ className, ref, ...props }: React.ComponentProps<typeof Text>) => {
  const { state, isMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  if (!collapsed) {
    return (
      <Text
        data-slot="sidebar-label"
        tabIndex={-1}
        ref={ref}
        slot="label"
        className={cn("col-start-2 truncate pe-6 outline-hidden", className)}
        {...props}
      >
        {props.children}
      </Text>
    )
  }
  return null
}

interface SidebarNavProps extends React.ComponentProps<"nav"> {
  isSticky?: boolean
}

const SidebarNav = ({ isSticky = false, className, ...props }: SidebarNavProps) => {
  return (
    <nav
      data-slot="sidebar-nav"
      className={cn(
        "isolate flex items-center justify-between gap-x-2 px-(--container-padding,--spacing(4)) py-2.5 text-white sm:justify-start sm:px-(--gutter,--spacing(4)) md:w-full",
        isSticky && "static top-0 z-40 group-has-data-[intent=default]/sidebar-root:sticky",
        className,
      )}
      {...props}
    />
  )
}

interface SidebarMenuTriggerProps extends ButtonProps {
  alwaysVisible?: boolean
}
const SidebarMenuTrigger = ({
  alwaysVisible = false,
  className,
  ...props
}: SidebarMenuTriggerProps) => {
  return (
    <Trigger
      className={cn(
        !alwaysVisible &&
          "opacity-0 pressed:opacity-100 group-hover/sidebar-item:opacity-100 group-focus-visible/sidebar-item:opacity-100 group/sidebar-item:pressed:opacity-100",
        "absolute end-0 flex h-full w-[calc(var(--sidebar-width)-90%)] items-center justify-end pe-2.5 outline-hidden",
        "**:data-[slot=icon]:shrink-0 [&_[data-slot='icon']:not([class*='size-'])]:size-5 sm:[&_[data-slot='icon']:not([class*='size-'])]:size-4 pressed:[&_[data-slot='icon']:not([class*='text-'])]:text-white",
        "pressed:text-white text-quebi-fg-muted hover:text-white",
        className,
      )}
      {...props}
    />
  )
}

export type {
  SidebarDisclosureGroupProps,
  SidebarDisclosureProps,
  SidebarDisclosureTriggerProps,
  SidebarItemProps,
  SidebarLinkProps,
  SidebarNavProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarSectionProps,
  SidebarSeparatorProps,
}

export {
  Sidebar,
  SidebarContent,
  SidebarDisclosure,
  SidebarDisclosureGroup,
  SidebarDisclosurePanel,
  SidebarDisclosureTrigger,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  SidebarLink,
  SidebarMenuTrigger,
  SidebarNav,
  SidebarProvider,
  SidebarRail,
  SidebarSection,
  SidebarSectionGroup,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
