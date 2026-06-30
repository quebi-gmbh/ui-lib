"use client"

import { useMemo } from "react"
import { Button } from "react-aria-components"
import { Link } from "@/components/link"
import { cn } from "@/lib/utils"

/**
 * BarList — quebi design system
 *
 * A horizontal bar chart for ranked categorical data. Each row is a
 * translucent brand-teal bar whose width encodes its value relative to the
 * largest entry, with the value rendered in a fixed column on the right.
 * Rows become clickable Buttons when `onValueChange` is provided, and the
 * bar brightens on hover. Names with an `href` render as a sibling Link.
 */
type Bar<T> = T & {
  key?: string
  href?: string
  value: number
  name: string
}

interface BarListProps<T = unknown> extends React.ComponentProps<"div"> {
  data: Bar<T>[]
  valueFormatter?: (value: number) => string
  onValueChange?: (payload: Bar<T>) => void
  sortOrder?: "ascending" | "descending" | "none"
}

export function BarList<T>({
  data = [],
  valueFormatter = (value) => value.toString(),
  onValueChange,
  sortOrder = "descending",
  className,
  ref,
  ...props
}: BarListProps<T>) {
  const Component = onValueChange ? Button : "div"
  const sortedData = useMemo(() => {
    if (sortOrder === "none") {
      return data
    }
    return [...data].sort((a, b) => {
      return sortOrder === "ascending" ? a.value - b.value : b.value - a.value
    })
  }, [data, sortOrder])

  const widths = useMemo(() => {
    const maxValue = Math.max(...sortedData.map((item) => item.value), 0)
    return sortedData.map((item) =>
      item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 2),
    )
  }, [sortedData])

  const rowHeight = "h-8"

  return (
    <div
      ref={ref}
      data-slot="bar-list"
      className={cn("flex justify-between gap-x-6", className)}
      {...props}
    >
      <div className="relative w-full space-y-1.5">
        {sortedData.map((item, index) => (
          <Component
            key={item.key ?? item.name}
            onClick={() => {
              onValueChange?.(item)
            }}
            className={cn(
              "group w-full rounded-quebi-sm outline-none",
              "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
              onValueChange &&
                "m-0! cursor-pointer transition-colors duration-150 hover:bg-cyan-500/5",
            )}
          >
            <div
              className={cn(
                "flex items-center rounded-quebi-sm bg-quebi-brand/15 transition-colors duration-150",
                rowHeight,
                onValueChange && "group-hover:bg-quebi-brand/25",
                index === sortedData.length - 1 && "mb-0",
              )}
              style={{ width: `${widths[index]}%` }}
            >
              <div className="absolute start-2 flex max-w-full pe-3 sm:pe-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="truncate whitespace-nowrap rounded-quebi-sm font-normal text-sm/6 text-white no-underline hover:text-quebi-brand-hover hover:underline hover:underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <p className="truncate whitespace-nowrap text-sm/6 text-white">{item.name}</p>
                )}
              </div>
            </div>
          </Component>
        ))}
      </div>
      <div>
        {sortedData.map((item, index) => (
          <div
            key={item.key ?? item.name}
            className={cn(
              "flex items-center justify-end",
              rowHeight,
              index === sortedData.length - 1 ? "mb-0" : "mb-1.5",
            )}
          >
            <p className="truncate whitespace-nowrap text-quebi-fg-muted text-sm leading-none">
              {valueFormatter(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
