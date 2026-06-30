"use client"

import { twMerge } from "tailwind-merge"
import { Link, type LinkProps } from "@/components/link"

/**
 * Pagination — Cellestial Design System
 *
 * Uses its own styling (not `buttonStyles`) so the list of page numbers reads
 * like a row of compact navigation targets rather than a row of buttons. All
 * interactive elements are 32px (admin touch target), `rounded-xs`, and use
 * ink tokens only — no brand color, since pagination is navigation chrome.
 */

const navTargetClasses = [
  "inline-flex h-8 min-w-8 shrink-0 items-center justify-center",
  "rounded-xs border border-solid",
  "select-none font-body text-[13px] font-medium leading-none",
  "transition-[color,background-color,border-color] duration-100 ease-out",
  "outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-200 focus-visible:outline-offset-2",
].join(" ")

const navTargetInteractive = [
  "cursor-pointer border-ink-200 bg-surface text-ink-700",
  "hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-primary-subtle dark:hover:text-primary-subtle-fg",
].join(" ")

const navTargetDisabled = "cursor-not-allowed border-ink-100 bg-surface text-ink-300"

const pageTargetClasses = [
  "inline-flex h-8 min-w-8 shrink-0 items-center justify-center",
  "px-2 rounded-xs",
  "select-none font-body text-[13px] font-medium leading-none tabular-nums",
  "transition-[color,background-color] duration-100 ease-out",
  "outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-200 focus-visible:outline-offset-2",
].join(" ")

const pageTargetInteractive = [
  "cursor-pointer text-ink-700",
  "hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-primary-subtle dark:hover:text-primary-subtle-fg",
].join(" ")

const pageTargetCurrent = [
  "cursor-default bg-brand-500 text-white",
  "aria-[current=page]:bg-brand-500 aria-[current=page]:text-white",
].join(" ")

const Pagination = ({ className, ref, ...props }: React.ComponentProps<"nav">) => (
  <nav
    data-slot="pagination"
    aria-label="Pagination"
    className={twMerge("mx-auto flex w-full items-center justify-center gap-2", className)}
    ref={ref}
    {...props}
  />
)

const PaginationList = ({ className, ref, ...props }: React.ComponentProps<"ul">) => (
  <ul
    ref={ref}
    data-slot="pagination-list"
    className={twMerge("flex items-center gap-1", className)}
    {...props}
  />
)

interface PaginationItemProps extends Omit<LinkProps, "children" | "className"> {
  className?: string
  isCurrent?: boolean
  children?: string | number
}

const PaginationItem = ({ className, isCurrent, children, ...props }: PaginationItemProps) => (
  <li>
    <Link
      data-slot="pagination-item"
      href={isCurrent ? undefined : props.href}
      aria-current={isCurrent ? "page" : undefined}
      className={twMerge(
        pageTargetClasses,
        isCurrent ? pageTargetCurrent : pageTargetInteractive,
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  </li>
)

interface PaginationNavProps extends Omit<LinkProps, "className" | "children"> {
  className?: string
  children?: React.ReactNode
}

const NavLink = ({
  className,
  href,
  label,
  children,
  ...props
}: PaginationNavProps & { label: string }) => {
  const isDisabled = href === undefined
  return (
    <li>
      <Link
        data-slot="pagination-item"
        aria-label={label}
        aria-disabled={isDisabled ? true : undefined}
        href={href}
        className={twMerge(
          navTargetClasses,
          isDisabled ? navTargetDisabled : navTargetInteractive,
          className,
        )}
        {...props}
      >
        {children}
      </Link>
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
    className={twMerge(
      "inline-flex h-8 min-w-8 select-none items-center justify-center",
      "font-body text-[13px] font-medium text-ink-500",
      className,
    )}
    {...props}
  >
    {children}
  </li>
)

const PaginationInfo = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p
    className={twMerge(
      "text-[13px] text-ink-500 *:[strong]:font-semibold *:[strong]:text-ink-900",
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
