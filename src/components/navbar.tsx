"use client"

import { Menu } from "lucide-react"
import { LayoutGroup, motion } from "motion/react"
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"
import type { LinkProps } from "react-aria-components"
import { Link } from "react-aria-components"
import { twJoin, twMerge } from "tailwind-merge"
import { Button, type ButtonProps } from "@/components/button"
import { Separator } from "@/components/separator"
import { Sheet, SheetBody, SheetContent } from "@/components/sheet"
import { cn } from "@/lib/utils"

/**
 * Navbar — quebi design system
 *
 * A responsive top/bottom navigation bar. On desktop it renders an inline bar
 * (surface bg-quebi-bg, hairline cyan border); below the mobile breakpoint it
 * collapses into a Sheet drawer toggled by the NavbarTrigger.
 *
 * The active link is marked with the brand teal indicator. Depth comes from the
 * quebi hairline border, not drop shadows.
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

  if (isMobile === undefined) {
    return null
  }

  return (
    <NavbarContext value={contextValue}>
      <div
        className={twMerge(
          "peer/navbar group/navbar relative isolate z-10 flex w-full flex-col",
          "has-data-navbar-inset:min-h-svh has-data-navbar-inset:bg-quebi-bg",
          className,
        )}
        {...props}
      />
    </NavbarContext>
  )
}

type Intent = "default" | "float" | "inset"
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
            "rounded-quebi-md bg-quebi-bg py-0 *:data-[navbar=content]:max-w-7xl *:data-[navbar=content]:rounded-quebi-md *:data-[navbar=content]:border *:data-[navbar=content]:border-cyan-500/10 *:data-[navbar=content]:bg-quebi-bg *:data-[navbar=content]:px-4 *:data-[navbar=content]:py-(--navbar-gutter) *:data-[navbar=content]:shadow-quebi-glow",
          ["default", "inset"].includes(intent) && "px-4",
          intent === "default" && "border-b border-cyan-500/10 bg-quebi-bg",
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
  const id = useId()
  return (
    <LayoutGroup id={id}>
      <div
        data-slot="navbar-section"
        className={twMerge(
          "col-span-full grid grid-cols-[auto_1fr] flex-col gap-3 gap-y-0.5 md:flex md:flex-none md:grid-cols-none md:flex-row md:items-center md:gap-2.5",
          className,
        )}
        {...props}
      >
        {props.children}
      </div>
    </LayoutGroup>
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
      className={cn(
        [
          "href" in props ? "cursor-pointer" : "cursor-default",
          "group/navbar-item pressed:bg-white/[0.06] pressed:text-white hover:bg-white/[0.04] hover:text-white",
          "text-quebi-fg-muted aria-[current=page]:text-white aria-[current=page]:*:data-[slot=icon]:text-quebi-brand",
          "col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] supports-[grid-template-columns:subgrid]:grid-cols-subgrid md:supports-[grid-template-columns:subgrid]:grid-cols-none",
          "relative min-w-0 items-center gap-x-3 rounded-quebi-sm p-2 text-start font-medium text-base/6 md:gap-x-(--navbar-gutter) md:px-(--navbar-gutter) md:py-[calc(var(--navbar-gutter)---spacing(0.5))] md:text-sm/5",
          "*:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-quebi-fg-subtle md:*:data-[slot=icon]:size-4",
          "*:data-[slot=loader]:size-5 *:data-[slot=loader]:shrink-0 md:*:data-[slot=loader]:size-4",
          "*:not-nth-2:last:data-[slot=icon]:row-start-1 *:not-nth-2:last:data-[slot=icon]:ms-auto *:not-nth-2:last:data-[slot=icon]:size-5 md:*:not-nth-2:last:data-[slot=icon]:size-4",
          "*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-6 md:*:data-[slot=avatar]:size-5",
          "pressed:*:data-[slot=icon]:text-white hover:*:data-[slot=icon]:text-white",
          "transition-colors duration-150",
          "outline-hidden focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
          "text-start disabled:cursor-default disabled:opacity-50",
        ],
        className,
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof props.children === "function" ? props.children(values) : props.children}

          {(isCurrent || values.isCurrent) && (
            <motion.span
              data-slot="current-indicator"
              layoutId="current-indicator"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={twJoin(
                "absolute rounded-full bg-quebi-brand [--gutter:--spacing(0.5)]",
                "inset-y-[calc(var(--navbar-gutter)---spacing(0.5))] -start-4 w-(--gutter) md:inset-y-auto md:w-auto",
                "md:inset-x-2 md:-bottom-[calc(var(--navbar-gutter)+1px)] md:h-(--gutter)",
              )}
            />
          )}
        </>
      )}
    </Link>
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
        "group-has-data-navbar-sticky/navbar:group-has-placement-top/navbar:top-0 group-has-data-navbar-sticky/navbar:group-has-placement-top/navbar:border-b group-has-data-navbar-sticky/navbar:group-has-placement-top/navbar:border-cyan-500/10",
        // bottom
        "group-has-data-navbar-sticky/navbar:group-has-placement-bottom/navbar:bottom-0 group-has-data-navbar-sticky/navbar:group-has-placement-bottom/navbar:border-t group-has-data-navbar-sticky/navbar:group-has-placement-bottom/navbar:border-cyan-500/10",
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
      className={twMerge("flex flex-1 flex-col bg-quebi-bg pb-2 md:px-2", className)}
      {...props}
    >
      <div className="grow bg-quebi-bg p-6 md:rounded-quebi-md md:p-16 md:shadow-quebi-glow md:ring-1 md:ring-cyan-500/10">
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
      className={cn("-ms-2 lg:hidden", className)}
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
