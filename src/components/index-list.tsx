import { Link } from "@/components/link"
import { cn } from "@/lib/utils"

/**
 * IndexList — quebi design system
 *
 * A numbered list ruled by hairlines, for work, articles or anything people
 * pick from: a mono number, a title in Outfit, a caption of meta on the right.
 * The list opens on the strong rule, the rows close on hairlines.
 *
 * A row with an `href` is a link across its full width, and answers hover by
 * shifting right and lifting to the raised ground — the one place in the
 * system a row moves. A row without one is static text and does not move, so
 * nothing looks clickable that is not.
 *
 * Put a `display-s` heading and an `Eyebrow` count ("04 entries") above it.
 * For rows the user selects or acts on in place, use `GridList`; for rows with
 * many fields, a `Table`.
 */

export interface IndexListItem {
  /** Stable key. Defaults to the row's number. */
  id?: string
  title: React.ReactNode
  meta?: React.ReactNode
  href?: string
  /** Shown in the number column. Defaults to the position, zero-padded: 01, 02, …. */
  number?: string
}

export interface IndexListProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  items: IndexListItem[]
}

const ROW = "grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3.5 px-1 py-3.5 text-quebi-fg"

/** Restates every part of the Link's own look the row does not want: it is a row, not prose. */
const LINK_ROW = [
  "font-sans font-normal no-underline hover:no-underline hover:text-quebi-fg",
  "transition-[padding,background-color] duration-300 ease-out",
  "hover:bg-quebi-raised hover:pl-3",
  "focus-visible:ring-inset focus-visible:ring-offset-0",
]

export function IndexList({ items, className, ...props }: IndexListProps) {
  return (
    <ol
      data-slot="index-list"
      className={cn("m-0 list-none border-t border-quebi-rule p-0", className)}
      {...props}
    >
      {items.map((item, position) => {
        const number = item.number ?? String(position + 1).padStart(2, "0")
        const cells = (
          <>
            <span className="font-mono text-xs text-quebi-fg-subtle">{number}</span>
            <span className="font-display text-quebi-title">{item.title}</span>
            {item.meta != null ? (
              <span className="text-right text-quebi-caption text-quebi-fg-subtle">{item.meta}</span>
            ) : (
              <span />
            )}
          </>
        )
        return (
          <li key={item.id ?? number} data-slot="index-list-item" className="border-b border-quebi-hairline">
            {item.href ? (
              <Link href={item.href} className={cn(ROW, LINK_ROW)}>
                {cells}
              </Link>
            ) : (
              <div className={ROW}>{cells}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
