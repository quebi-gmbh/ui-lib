"use client"

import { createContext, use } from "react"
import type { BreadcrumbProps, BreadcrumbsProps, LinkProps } from "react-aria-components"
import {
  Breadcrumb,
  Breadcrumbs as BreadcrumbsPrimitive,
  composeRenderProps,
} from "react-aria-components"
import { Link } from "@/components/link"
import { cn } from "@/lib/utils"

/**
 * Breadcrumbs — quebi design system
 *
 * Compact navigation trail, set in the design's nav role (Outfit 14px).
 * Intermediate crumbs are links in the body ink that turn to full ink and
 * underline on hover, like the top navigation; the current crumb is full ink
 * and never underlines. The separator glyph (chevron or slash) is subtle.
 * Built on react-aria-components for the accessibility baseline.
 */

type BreadcrumbsContextProps = { separator?: "chevron" | "slash" | boolean }
const BreadcrumbsProvider = createContext<BreadcrumbsContextProps>({
  separator: "chevron",
})

const Breadcrumbs = <T extends object>({
  className,
  ...props
}: BreadcrumbsProps<T> & BreadcrumbsContextProps) => {
  return (
    <BreadcrumbsProvider value={{ separator: props.separator }}>
      <BreadcrumbsPrimitive
        {...props}
        className={cn("flex items-center gap-2 font-display text-quebi-nav", className)}
      />
    </BreadcrumbsProvider>
  )
}

interface BreadcrumbsItemProps extends BreadcrumbProps, BreadcrumbsContextProps {
  href?: string
}

const BreadcrumbsItem = ({
  href,
  separator = true,
  className,
  ...props
}: BreadcrumbsItemProps & Partial<Omit<LinkProps, "className">>) => {
  const { separator: contextSeparator } = use(BreadcrumbsProvider)
  separator = contextSeparator ?? separator
  const separatorValue = separator === true ? "chevron" : separator

  return (
    <Breadcrumb
      className={composeRenderProps(className, (resolved) =>
        cn("flex items-center gap-2 text-quebi-fg-muted", resolved),
      )}
      data-slot="breadcrumb-item"
      {...props}
    >
      {({ isCurrent }) => (
        <>
          <Link
            className={cn(
              "no-underline",
              "has-data-[slot=icon]:inline-flex has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-2",
              "*:data-[slot=icon]:size-4",
              isCurrent
                ? "cursor-default text-quebi-fg hover:no-underline"
                : "text-quebi-fg-muted hover:text-quebi-fg hover:*:data-[slot=icon]:text-quebi-fg",
            )}
            href={href}
            {...props}
          />
          {!isCurrent && separator !== false && <Separator separator={separatorValue} />}
        </>
      )}
    </Breadcrumb>
  )
}

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    data-slot="icon"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
)

const Separator = ({
  separator = "chevron",
}: {
  separator?: BreadcrumbsItemProps["separator"]
}) => {
  return (
    <span className="*:shrink-0 *:text-quebi-fg-subtle *:data-[slot=icon]:size-3.5">
      {separator === "chevron" && <ChevronRightIcon />}
      {separator === "slash" && <span>/</span>}
    </span>
  )
}

Breadcrumbs.Item = BreadcrumbsItem

export type { BreadcrumbsItemProps, BreadcrumbsProps }
export { Breadcrumbs, BreadcrumbsItem }
