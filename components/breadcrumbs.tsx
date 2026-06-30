import { ChevronRightIcon } from "@heroicons/react/24/solid"
import { createContext, use } from "react"
import type { BreadcrumbProps, BreadcrumbsProps, LinkProps } from "react-aria-components"
import { Breadcrumb, Breadcrumbs as BreadcrumbsPrimitive } from "react-aria-components"
import { twJoin, twMerge } from "tailwind-merge"
import { cx } from "@/lib/primitive"
import { Link } from "./link"

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
      <BreadcrumbsPrimitive {...props} className={twMerge("flex items-center gap-2", className)} />
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
      // Cellestial DS — body-s (14px) with ink-500 default; current crumb
      // shifts to ink-900 via the Link's own aria-current styling.
      className={cx("flex items-center gap-2 text-[14px] text-ink-500", className)}
      data-slot="breadcrumb-item"
      {...props}
    >
      {({ isCurrent }) => (
        <>
          <Link
            className={twJoin(
              "has-data-[slot=icon]:inline-flex has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-2",
              "*:data-[slot=icon]:size-4",
              "*:data-[slot=icon]:text-ink-500 hover:*:data-[slot=icon]:text-ink-900",
              isCurrent ? "text-ink-900 font-semibold" : "text-ink-500 hover:text-ink-900",
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

const Separator = ({
  separator = "chevron",
}: {
  separator?: BreadcrumbsItemProps["separator"]
}) => {
  return (
    <span className="*:shrink-0 *:text-ink-300 *:data-[slot=icon]:size-3.5">
      {separator === "chevron" && <ChevronRightIcon />}
      {separator === "slash" && <span className="text-ink-300">/</span>}
    </span>
  )
}

Breadcrumbs.Item = BreadcrumbsItem

export type { BreadcrumbsItemProps, BreadcrumbsProps }
export { Breadcrumbs, BreadcrumbsItem }
