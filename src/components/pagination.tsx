"use client"

import { createContext, use, useState } from "react"
import {
  Button as PressTarget,
  type ButtonProps as PressTargetProps,
  Form,
  Link,
  type LinkProps,
} from "react-aria-components"
import { Button } from "@/components/button"
import { ButtonGroup } from "@/components/button-group"
import { FieldError, Label } from "@/components/field"
import { NumberField, NumberInput } from "@/components/number-field"
import { cn } from "@/lib/utils"

/**
 * Pagination — quebi design system
 *
 * A row of compact navigation targets for paging through results, and the
 * canonical shape that wraps it: `PaginationStack`, a centred column reading
 * "Showing 21–40 of 248" above the page numbers, with an optional
 * `PaginationJump` under them. That column is what a paged list or a table
 * should render — it was a `div` copied out of the gallery until it was a
 * component, which is the only reason this file is bigger than the row.
 *
 * A target with an `href` is an anchor — a URL per page, something you can
 * middle-click — and that is what makes this the pager for a page of a
 * document. Give it an `onPress` and no `href` instead and it is a button that
 * reports the page, for a page that is a parameter of a query and has no
 * address. `TablePager` is the second kind, and the only difference between the
 * two rows is which of those two props each target carries.
 *
 * Sizes match `Button` and the field scale — `xs` is 30px, `sm` 38px and the
 * default — so a pager can stand beside a select and a button and agree with
 * them on a height.
 */

/** The target scale. Matches `Button`'s `xs` / `sm` and the field sizes. */
export type PaginationSize = "xs" | "sm"

/**
 * The size the surrounding `<Pagination>` asked for. A pager is a row of parts
 * that have to agree on one height, and passing the prop to each of them by
 * hand is a convention nobody can enforce — `src/registry/*.examples.tsx` is
 * copied verbatim, so the omission would propagate. An explicit prop on a part
 * still wins; the context is the default, never the rule.
 */
const PaginationSizeContext = createContext<PaginationSize>("sm")

const usePaginationSize = (own?: PaginationSize): PaginationSize => {
  const inherited = use(PaginationSizeContext)
  return own ?? inherited
}

const navTargetClasses = [
  "inline-flex shrink-0 items-center justify-center",
  "rounded-quebi-sm border border-solid",
  "font-sans font-medium leading-none select-none",
  "transition-[color,background-color,border-color] duration-150 ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
].join(" ")

// `size-*` is border-box, so these are the same numbers `Button`'s `sq-xs` and
// `sq-sm` use: the 1px border on each side is included, which is what makes a
// nav target and the icon button beside it line up.
const navTargetSizes = {
  xs: "size-7.5 *:data-[slot=icon]:size-3.5",
  sm: "size-9.5 *:data-[slot=icon]:size-4",
} as const satisfies Record<PaginationSize, string>

const navTargetInteractive = [
  "cursor-pointer border-quebi-line/20 bg-transparent text-quebi-fg-muted",
  "hover:border-quebi-brand-mark hover:text-quebi-brand-text hover:bg-quebi-surface/[0.04]",
].join(" ")

const navTargetDisabled = "cursor-not-allowed border-quebi-line/10 bg-transparent text-quebi-fg-subtle"

const pageTargetClasses = [
  "inline-flex shrink-0 items-center justify-center",
  "rounded-quebi-sm",
  "font-sans font-medium leading-none tabular-nums select-none",
  "transition-[color,background-color] duration-150 ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
].join(" ")

// A page number is text, so its height is set rather than derived from padding:
// the nav targets carry a border and these do not, and two controls that agree
// on `py-*` but not on their borders are 2px apart.
const pageTargetSizes = {
  xs: "h-7.5 min-w-7.5 px-2 text-xs",
  sm: "h-9.5 min-w-9.5 px-3 text-sm",
} as const satisfies Record<PaginationSize, string>

const pageTargetInteractive = [
  "cursor-pointer text-quebi-fg-muted",
  "hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
].join(" ")

const pageTargetCurrent = [
  "cursor-default bg-quebi-brand text-quebi-on-brand",
  "aria-[current=page]:bg-quebi-brand aria-[current=page]:text-quebi-on-brand",
].join(" ")

interface TargetProps extends Omit<LinkProps, "children" | "className"> {
  className: string
  children?: React.ReactNode
}

/**
 * One target, as whichever element its destination makes it.
 *
 * An `href` is an address, so it is an anchor — middle-clickable, copyable, and
 * the reason this family is link-based at all. A callback is not an address,
 * and this repo says so out loud in its own element rule: a control that
 * changes the URL must be an anchor, and one that acts in place is a button.
 * So the press-only form is a real `button`, which is also how it keeps Space —
 * react-aria's `Link` answers to Enter alone, and a pager you can only half
 * operate from the keyboard is not the reuse anyone asked for.
 *
 * The `href` key is dropped rather than passed as `undefined` on the way: react-aria
 * reads `'href' in props`, and an `href` holding `undefined` reaches React as an
 * empty string, which it warns about on every render.
 */
const Target = ({ href, children, ...props }: TargetProps) =>
  href === undefined ? (
    // Everything a pager passes — `onPress`, `isDisabled`, the ARIA attributes,
    // `data-slot` and the class — is common to both primitives. What is not is
    // the half of `LinkProps` that describes an address, and there is none.
    <PressTarget {...(props as PressTargetProps)}>{children}</PressTarget>
  ) : (
    <Link href={href} {...props}>
      {children}
    </Link>
  )

interface PaginationProps extends Omit<React.ComponentProps<"nav">, "children"> {
  /** Target height for every part inside. Defaults to `sm` (38px). */
  size?: PaginationSize
  children?: React.ReactNode
}

const Pagination = ({ className, size, ref, children, ...props }: PaginationProps) => (
  <nav
    data-slot="pagination"
    aria-label="Pagination"
    className={cn("mx-auto flex w-full items-center justify-center gap-2", className)}
    ref={ref}
    {...props}
  >
    <PaginationSizeContext value={size ?? "sm"}>{children}</PaginationSizeContext>
  </nav>
)

/**
 * The blessed arrangement: the range summary, then the pager, then whatever
 * else the surface offers — a jump field, a rows-per-page select — centred in
 * one column.
 *
 * This was a `<div className="flex w-full flex-col items-center gap-3">` in the
 * gallery, which meant the shape existed only as something to copy. An example
 * is copied verbatim through `/api/components/pagination.json`, so a shape that
 * is not importable is a shape that gets re-typed slightly differently
 * everywhere it is used.
 */
const PaginationStack = ({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="pagination-stack"
    className={cn("flex w-full flex-col items-center gap-3", className)}
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

interface PaginationItemProps extends Omit<LinkProps, "children" | "className"> {
  className?: string
  isCurrent?: boolean
  size?: PaginationSize
  children?: string | number
}

const PaginationItem = ({
  className,
  isCurrent,
  size,
  children,
  href,
  onPress,
  ...props
}: PaginationItemProps) => {
  const resolved = usePaginationSize(size)
  return (
    <li>
      <Target
        data-slot="pagination-item"
        // The page you are on is not somewhere to go, whichever way the target
        // navigates — so neither the href nor the callback survives `isCurrent`.
        // Dropping both leaves a target with nothing to press, which is the
        // point — but a focusable one: `aria-current="page"` is what says you
        // are here, and taking the page you are on out of the tab order would
        // mean tabbing through a pager skips the only item that answers "where".
        href={isCurrent ? undefined : href}
        onPress={isCurrent ? undefined : onPress}
        aria-current={isCurrent ? "page" : undefined}
        className={cn(
          pageTargetClasses,
          pageTargetSizes[resolved],
          isCurrent ? pageTargetCurrent : pageTargetInteractive,
          className,
        )}
        {...props}
      >
        {children}
      </Target>
    </li>
  )
}

interface PaginationNavProps extends Omit<LinkProps, "className" | "children"> {
  className?: string
  size?: PaginationSize
  children?: React.ReactNode
}

const NavLink = ({
  className,
  href,
  onPress,
  isDisabled,
  size,
  children,
  label,
  ...props
}: PaginationNavProps & { label: string }) => {
  // Nothing to navigate to and nothing to call is what disabled means here, and
  // that is still what the link examples rely on — `<PaginationFirst />` with no
  // props renders as the disabled edge. Stated as a fallback rather than as the
  // rule, because a press-only arrow has no href either and is not disabled.
  const disabled = isDisabled ?? (href === undefined && onPress === undefined)
  const resolved = usePaginationSize(size)
  return (
    <li>
      <Target
        data-slot="pagination-item"
        aria-label={label}
        // react-aria's own disabled state: it removes the href, blocks the press,
        // and sets aria-disabled, which the hand-written version only did in ARIA.
        isDisabled={disabled}
        href={href}
        onPress={onPress}
        className={cn(
          navTargetClasses,
          navTargetSizes[resolved],
          disabled ? navTargetDisabled : navTargetInteractive,
          className,
        )}
        {...props}
      >
        {children}
      </Target>
    </li>
  )
}

const FirstIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
  size,
  children = <>&hellip;</>,
  ...props
}: React.ComponentProps<"li"> & { size?: PaginationSize }) => {
  const resolved = usePaginationSize(size)
  return (
    <li
      data-slot="pagination-gap"
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center select-none",
        "font-sans font-medium text-quebi-fg-subtle",
        pageTargetSizes[resolved],
        className,
      )}
      {...props}
    >
      {children}
    </li>
  )
}

const PaginationInfo = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p
    className={cn(
      "text-[13px] text-quebi-fg-muted *:[strong]:font-semibold *:[strong]:text-quebi-fg",
      className,
    )}
    {...props}
  />
)

export interface PaginationJumpProps {
  /**
   * The page the field shows, one-based — the number a reader sees on the
   * current target, not the zero-based index a query uses.
   *
   * The field follows it. That is the whole reason this is a component rather
   * than an input beside the pager: an uncontrolled field seeded once shows the
   * page you were on when it mounted, and a number box disagreeing with the
   * row of page numbers next to it is worse than no number box.
   */
  page?: number
  /** Pages there are. Without it, any page from 1 up is accepted. */
  pageCount?: number
  /** The page that was asked for, one-based. */
  onJump: (page: number) => void
  /** The visible label. A bare number box next to a "Go" explains nothing. */
  label?: React.ReactNode
  /** Height for the field and the button. Inherited from `Pagination`. */
  size?: PaginationSize
  className?: string
}

/**
 * Type a page, press Go.
 *
 * The bound is checked on submit and reported as a field error, so "page 900 of
 * 15" is a message under the input rather than a query that comes back empty
 * and looks like a table with no rows.
 *
 * `Go` is the field's verb, so it shares the field's edge rather than floating
 * beside it, and the label sits beside the control rather than above it — a
 * pager is a row of chrome, and a label-above stack would make it a line
 * taller. The error keeps the line underneath to itself.
 */
const PaginationJump = ({
  page,
  pageCount,
  onJump,
  label = "Go to page",
  size,
  className,
}: PaginationJumpProps) => {
  const resolved = usePaginationSize(size)
  const [value, setValue] = useState(page ?? 1)
  const [error, setError] = useState<string>()
  // Derived state: the page moved under us (a press on a number, a filter that
  // clamped the page, a page-size change), so the field is stale and the error
  // beside it is about a page nobody is asking for any more.
  const [shownPage, setShownPage] = useState(page)
  if (page !== shownPage) {
    setShownPage(page)
    setValue(page ?? 1)
    setError(undefined)
  }

  return (
    <Form
      data-slot="pagination-jump"
      // The bound is reported as a field error, not as the browser's own
      // bubble: native validation would refuse the submit before the handler
      // below ever ran, and the message under the input would never appear.
      validationBehavior="aria"
      className={cn("w-fit", className)}
      onSubmit={(event) => {
        event.preventDefault()
        if (!Number.isFinite(value) || value < 1 || (pageCount != null && value > pageCount)) {
          setError(
            pageCount == null ? "Enter a page number" : `Enter a page between 1 and ${pageCount}`,
          )
          return
        }
        setError(undefined)
        onJump(value)
      }}
    >
      {/* `items-start` rather than the group's `items-stretch`, so `Go` stays
          level with the input when the field grows a line to say which pages
          exist. */}
      <ButtonGroup className="items-start">
        <NumberField
          value={value}
          onChange={setValue}
          // Deliberately no `minValue` / `maxValue`: react-aria clamps to them
          // on commit, so "900" would silently become the last page and the
          // reader would never learn there is no page 900. The bound is a
          // message instead.
          formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
          isInvalid={error !== undefined}
          className={cn(
            // The field publishes a label-above-control stack; the label moves
            // beside the control here and an error keeps the line underneath.
            // The `!` is load-bearing: tailwind-merge groups utilities by name
            // and leaves a pair that differ only by an arbitrary variant both
            // standing, so `mt-1.5` would otherwise win or lose on sheet order.
            "flex w-auto flex-wrap items-center gap-x-2 gap-y-1",
            "[&>[data-slot=label]+[data-slot=control]]:mt-0!",
            "[&>[data-slot=control]+[slot=errorMessage]]:mt-0!",
            "[&>[data-slot=label]]:whitespace-nowrap",
            "[&>[slot=errorMessage]]:basis-full",
            "[&>[data-slot=control]]:w-16",
            // The group squares its children's inner corners; the corner that
            // meets `Go` belongs to the input inside this one.
            "[&_input]:rounded-e-none",
          )}
        >
          <Label>{label}</Label>
          {/*
            No steppers. They cost ~74px of the field's width, which leaves
            nothing for the digits, and they are the wrong affordance anyway:
            the value here is pending until `Go`, so stepping it navigates
            nowhere. ↑ / ↓ still step.
          */}
          <NumberInput hideStepper size={resolved} />
          {error !== undefined && <FieldError>{error}</FieldError>}
        </NumberField>
        <Button type="submit" intent="outline" size={resolved}>
          Go
        </Button>
      </ButtonGroup>
    </Form>
  )
}

export {
  Pagination,
  PaginationFirst,
  PaginationGap,
  PaginationInfo,
  PaginationItem,
  PaginationJump,
  PaginationLast,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  PaginationStack,
}
