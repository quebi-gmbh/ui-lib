"use client"

import { cn } from "@/lib/utils"

/**
 * Pagination — quebi design system
 *
 * A row of compact navigation targets for paging through results. Self-contained:
 * built on plain anchors so it carries no sibling dependencies. The active page
 * uses the quebi brand teal; everything else is navigation chrome on the dark
 * surface. Interactive targets are 32px and use the quebi border signature.
 */

const navTargetClasses = [
  "inline-flex h-8 min-w-8 shrink-0 items-center justify-center",
  "rounded-quebi-sm border border-solid",
  "font-sans text-[13px] font-medium leading-none select-none",
  "transition-[color,background-color,border-color] duration-150 ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
].join(" ")

const navTargetInteractive = [
  "cursor-pointer border-cyan-500/20 bg-transparent text-quebi-fg-muted",
  "hover:border-quebi-brand hover:text-quebi-brand hover:bg-white/[0.04]",
].join(" ")

const navTargetDisabled = "cursor-not-allowed border-cyan-500/10 bg-transparent text-quebi-fg-subtle"

const pageTargetClasses = [
  "inline-flex h-8 min-w-8 shrink-0 items-center justify-center px-2",
  "rounded-quebi-sm",
  "font-sans text-[13px] font-medium leading-none tabular-nums select-none",
  "transition-[color,background-color] duration-150 ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
].join(" ")

const pageTargetInteractive = [
  "cursor-pointer text-quebi-fg-muted",
  "hover:bg-white/[0.04] hover:text-white",
].join(" ")

const pageTargetCurrent = [
  "cursor-default bg-quebi-brand text-quebi-bg",
  "aria-[current=page]:bg-quebi-brand aria-[current=page]:text-quebi-bg",
].join(" ")

const Pagination = ({ className, ref, ...props }: React.ComponentProps<"nav">) => (
  <nav
    data-slot="pagination"
    aria-label="Pagination"
    className={cn("mx-auto flex w-full items-center justify-center gap-2", className)}
    ref={ref}
    {...props}
  />
)

const PaginationList = ({ className, ref, ...props }: React.ComponentProps<"ul">) => (
  <ul
    ref={ref}
    data-slot="pagination-list"
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
)

interface PaginationItemProps extends Omit<React.ComponentProps<"a">, "children" | "className"> {
  className?: string
  isCurrent?: boolean
  children?: string | number
}

const PaginationItem = ({ className, isCurrent, children, href, ...props }: PaginationItemProps) => (
  <li>
    <a
      data-slot="pagination-item"
      href={isCurrent ? undefined : href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        pageTargetClasses,
        isCurrent ? pageTargetCurrent : pageTargetInteractive,
        className,
      )}
      {...props}
    >
      {children}
    </a>
  </li>
)

interface PaginationNavProps extends Omit<React.ComponentProps<"a">, "className" | "children"> {
  className?: string
  children?: React.ReactNode
}

const NavLink = ({
  className,
  href,
  children,
  label,
  ...props
}: PaginationNavProps & { label: string }) => {
  const isDisabled = href === undefined
  return (
    <li>
      <a
        data-slot="pagination-item"
        aria-label={label}
        aria-disabled={isDisabled ? true : undefined}
        href={href}
        className={cn(
          navTargetClasses,
          isDisabled ? navTargetDisabled : navTargetInteractive,
          className,
        )}
        {...props}
      >
        {children}
      </a>
    </li>
  )
}

const FirstIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-slot="icon"
    aria-hidden="true"
  >
    <path d="m17 18-6-6 6-6M7 6v12" />
  </svg>
)

const PrevIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-slot="icon"
    aria-hidden="true"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const NextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-slot="icon"
    aria-hidden="true"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
)

const LastIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-slot="icon"
    aria-hidden="true"
  >
    <path d="m7 6 6 6-6 6M17 6v12" />
  </svg>
)

const PaginationFirst = (props: PaginationNavProps) => (
  <NavLink label="First page" {...props}>
    <FirstIcon />
  </NavLink>
)

const PaginationPrevious = (props: PaginationNavProps) => (
  <NavLink label="Previous page" {...props}>
    <PrevIcon />
  </NavLink>
)

const PaginationNext = (props: PaginationNavProps) => (
  <NavLink label="Next page" {...props}>
    <NextIcon />
  </NavLink>
)

const PaginationLast = (props: PaginationNavProps) => (
  <NavLink label="Last page" {...props}>
    <LastIcon />
  </NavLink>
)

const PaginationGap = ({
  className,
  children = <>&hellip;</>,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    data-slot="pagination-gap"
    aria-hidden
    className={cn(
      "inline-flex h-8 min-w-8 items-center justify-center select-none",
      "font-sans text-[13px] font-medium text-quebi-fg-subtle",
      className,
    )}
    {...props}
  >
    {children}
  </li>
)

const PaginationInfo = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p
    className={cn(
      "text-[13px] text-quebi-fg-muted *:[strong]:font-semibold *:[strong]:text-white",
      className,
    )}
    {...props}
  />
)

export {
  Pagination,
  PaginationFirst,
  PaginationGap,
  PaginationInfo,
  PaginationItem,
  PaginationLast,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
}
