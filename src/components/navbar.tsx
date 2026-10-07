"use client"

import { Menu } from "lucide-react"
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react"
import type { LinkProps } from "react-aria-components"
import { composeRenderProps, Link } from "react-aria-components"
import { twJoin, twMerge } from "tailwind-merge"
import { Button, type ButtonProps } from "@/components/button"
import { Separator } from "@/components/separator"
import { Sheet, SheetBody, SheetContent } from "@/components/sheet"
import { cn } from "@/lib/utils"

/**
 * Navbar — quebi design system
 *
 * A responsive top/bottom navigation bar: the mark at the start, links in
 * Outfit at nav size, and a hairline under the bar (`intent="plain"` drops it,
 * for a bar that sits on a Stage). `float` lifts the bar off the page, so it
 * is the one intent that takes the floating-surface treatment (elevated
 * ground, small radius, the float shadow). Below the mobile breakpoint it
 * collapses into a Sheet drawer toggled by the NavbarTrigger.
 *
 * The current link — and a hovered one — is underlined 1px at a 5px offset,
 * the same mark a text link carries. No pill, no indicator bar.
 *
 * Composes @/components/button, @/components/separator, and @/components/sheet.
 */

const MOBILE_BREAKPOINT = 768

/** Inlined use-mobile hook: tracks whether the viewport is below md. */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

interface NavbarContextProps {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
  toggleNavbar: () => void
}

const NavbarContext = createContext<NavbarContextProps | null>(null)

const useNavbar = () => {
  const context = use(NavbarContext)
  if (!context) {
    throw new Error("useNavbar must be used within a NavbarProvider.")
  }

  return context
}

interface NavbarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const NavbarProvider = ({
  isOpen: openProp,
  onOpenChange: setOpenProp,
  defaultOpen = false,
  className,
  ...props
}: NavbarProviderProps) => {
  const [openInternal, setOpenInternal] = useState(defaultOpen)
  const open = openProp ?? openInternal

  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      if (setOpenProp) {
        return setOpenProp?.(typeof value === "function" ? value(open) : value)
      }

      setOpenInternal(value)
    },
    [setOpenProp, open],
  )

  const toggleNavbar = useCallback(() => {
    setOpen((open) => !open)
  }, [setOpen])

  const isMobile = useIsMobile()

  const contextValue = useMemo<NavbarContextProps>(
    () => ({
      open,
      setOpen,
      isMobile: isMobile ?? false,
      toggleNavbar,
    }),
    [open, setOpen, isMobile, toggleNavbar],
  )

  return (
    <NavbarContext value={contextValue}>
      <div
        className={twMerge(
          "peer/navbar group/navbar relative isolate z-10 flex w-full flex-col",
          "has-data-navbar-inset:min-h-svh has-data-navbar-inset:bg-quebi-raised",
          className,
        )}
        {...props}
      />
    </NavbarContext>
  )
}

type Intent = "default" | "plain" | "float" | "inset"
type Placement = "top" | "bottom"
type Side = "left" | "right"

interface StickyWithPlacement extends React.ComponentProps<"div"> {
  isSticky: true
  placement?: Placement
  side?: Side
  intent?: Intent
}

interface NonStickyWithoutPlacement extends React.ComponentProps<"div"> {
  isSticky?: false
  placement?: never
  side?: Side
  intent?: Intent
}

type NavbarProps = StickyWithPlacement | NonStickyWithoutPlacement

const Navbar = ({
  children,
  isSticky,
  placement = "top",
  intent = "default",
  side = "left",
  className,
  ref,
  ...props
}: NavbarProps) => {
  const { isMobile, open, setOpen } = useNavbar()
  if (isMobile) {
    return (
      <>
        <span
          className="sr-only"
          aria-hidden
          data-navbar={intent}
          data-navbar-sticky={isSticky}
          data-placement={placement ?? undefined}
        />
        <Sheet isOpen={open} onOpenChange={setOpen} {...props}>
          <SheetContent
            side={side}
            aria-label="Mobile Navbar"
            className="[&>button]:hidden"
          >
            <SheetBody className="p-4 sm:p-6">{children}</SheetBody>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div
      data-navbar={intent}
      ref={ref}
      data-placement={placement ?? undefined}
      data-navbar-sticky={isSticky}
      className={twMerge([
        "group/navbar-intent relative isolate",
        isSticky && "sticky top-0 z-40",
        placement === "top" && intent === "float" && "md:pt-8",
        placement === "bottom" && intent === "float" && "bottom-0 md:pb-8",
        intent === "float" && "mx-auto w-full max-w-7xl px-4 xl:max-w-(--breakpoint-xl)",
      ])}
      {...props}
    >
      <div
        className={twMerge(
          "relative isolate hidden py-(--navbar-gutter) [--navbar-gutter:--spacing(2.5)] md:block",
          intent === "float" &&
            "py-0 *:data-[navbar=content]:max-w-7xl *:data-[navbar=content]:border *:data-[navbar=content]:border-quebi-hairline *:data-[navbar=content]:rounded-quebi-s *:data-[navbar=content]:bg-quebi-elevated *:data-[navbar=content]:shadow-quebi-float *:data-[navbar=content]:px-4 *:data-[navbar=content]:py-(--navbar-gutter)",
          ["default", "plain", "inset"].includes(intent) && "px-4",
          intent === "default" && "border-b border-quebi-hairline bg-quebi-bg",
          className,
        )}
      >
        <div
          data-navbar="content"
          className="mx-auto w-full max-w-(--breakpoint-2xl) items-center md:flex"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const NavbarSection = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="navbar-section"
      className={twMerge(
        "col-span-full grid grid-cols-[auto_1fr] flex-col gap-3 gap-y-0.5 md:flex md:flex-none md:grid-cols-none md:flex-row md:items-center md:gap-1.5",
        className,
      )}
      {...props}
    >
      {props.children}
    </div>
  )
}

interface NavbarItemProps extends LinkProps {
  isCurrent?: boolean
}

const NavbarItem = ({ className, isCurrent, ...props }: NavbarItemProps) => {
  return (
    <Link
      data-slot="navbar-item"
      aria-current={isCurrent ? "page" : undefined}
      className={composeRenderProps(className, (resolved) =>
        cn(
          [
            "href" in props ? "cursor-pointer" : "cursor-default",
            "group/navbar-item text-quebi-fg decoration-1 underline-offset-5 hover:underline aria-[current=page]:underline aria-[current=page]:*:data-[slot=icon]:text-quebi-fg",
            "col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] supports-[grid-template-columns:subgrid]:grid-cols-subgrid md:supports-[grid-template-columns:subgrid]:grid-cols-none",
            "relative min-w-0 items-center gap-x-3 p-2 text-start font-display text-quebi-link md:gap-x-(--navbar-gutter) md:px-(--navbar-gutter) md:py-[calc(var(--navbar-gutter)---spacing(0.5))] md:text-quebi-nav",
            "*:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-quebi-fg-subtle md:*:data-[slot=icon]:size-4",
            "*:data-[slot=loader]:size-5 *:data-[slot=loader]:shrink-0 md:*:data-[slot=loader]:size-4",
            "*:not-nth-2:last:data-[slot=icon]:row-start-1 *:not-nth-2:last:data-[slot=icon]:ms-auto *:not-nth-2:last:data-[slot=icon]:size-5 md:*:not-nth-2:last:data-[slot=icon]:size-4",
            "*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-6 md:*:data-[slot=avatar]:size-5",
            "pressed:*:data-[slot=icon]:text-quebi-fg hover:*:data-[slot=icon]:text-quebi-fg",
            "transition-colors duration-150",
            "outline-hidden focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-3 focus-visible:ring-offset-quebi-bg",
            "text-start disabled:cursor-default disabled:opacity-50",
          ],
          resolved,
        ),
      )}
      {...props}
    />
  )
}

const NavbarSpacer = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return <div ref={ref} className={twMerge("-ms-4 flex-1", className)} {...props} />
}

const NavbarStart = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return <div ref={ref} className={twMerge("relative p-2 py-4 md:p-0.5", className)} {...props} />
}

const NavbarGap = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return <div ref={ref} className={twMerge("mx-2", className)} {...props} />
}

const NavbarSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => {
  return <Separator orientation="vertical" className={twMerge("h-5", className)} {...props} />
}

const NavbarMobile = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      data-slot="navbar-mobile"
      className={twMerge(
        "group/navbar-mobile flex items-center gap-x-3 px-4 py-2.5 md:hidden",
        "group-has-data-navbar-sticky/navbar:sticky group-has-data-navbar-sticky/navbar:bg-quebi-bg",
        // top
        "group-has-data-navbar-sticky/navbar:group-has-placement-top/navbar:top-0 group-has-data-navbar-sticky/navbar:group-has-placement-top/navbar:border-b group-has-data-navbar-sticky/navbar:group-has-placement-top/navbar:border-quebi-hairline",
        // bottom
        "group-has-data-navbar-sticky/navbar:group-has-placement-bottom/navbar:bottom-0 group-has-data-navbar-sticky/navbar:group-has-placement-bottom/navbar:border-t group-has-data-navbar-sticky/navbar:group-has-placement-bottom/navbar:border-quebi-hairline",
        className,
      )}
      {...props}
    />
  )
}

const NavbarInset = ({ className, ref, children, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      data-navbar-inset={true}
      className={twMerge("flex flex-1 flex-col bg-quebi-raised pb-2 md:px-2", className)}
      {...props}
    >
      <div className="grow bg-quebi-bg p-6 md:border md:border-quebi-hairline md:p-16">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    </div>
  )
}

interface NavbarTriggerProps extends ButtonProps {
  ref?: React.RefObject<HTMLButtonElement>
}

const NavbarTrigger = ({ className, onPress, ref, ...props }: NavbarTriggerProps) => {
  const { toggleNavbar } = useNavbar()
  return (
    <Button
      ref={ref}
      data-slot="navbar-trigger"
      intent="ghost"
      aria-label={props["aria-label"] || "Toggle Navbar"}
      size="sq-sm"
      className={composeRenderProps(className, (resolved) => cn("-ms-2 lg:hidden", resolved))}
      onPress={(event) => {
        onPress?.(event)
        toggleNavbar()
      }}
      {...props}
    >
      <Menu data-slot="icon" />
      <span className="sr-only">Toggle Navbar</span>
    </Button>
  )
}

const NavbarLabel = ({ className, ...props }: React.ComponentProps<"span">) => {
  return (
    <span
      data-slot="navbar-label"
      className={twJoin("col-start-2 row-start-1 truncate", className)}
      {...props}
    />
  )
}

export type { NavbarItemProps, NavbarProps, NavbarProviderProps, NavbarTriggerProps }
export {
  Navbar,
  NavbarGap,
  NavbarInset,
  NavbarItem,
  NavbarLabel,
  NavbarMobile,
  NavbarProvider,
  NavbarSection,
  NavbarSeparator,
  NavbarSpacer,
  NavbarStart,
  NavbarTrigger,
  useNavbar,
}
