import { Link, type LinkProps } from "react-router"
import { cn } from "@/lib/utils"

/**
 * A router link that reads as the library's `Link`.
 *
 * The site cannot use `Link` from `@/components/link` for internal navigation:
 * that one is react-aria's, which needs a `RouterProvider` to client-navigate,
 * and this app wires routing through react-router's own `Link` instead. So the
 * look has to be re-stated here — ink, a 1px underline at a 5px offset that
 * drops to 8px on hover. The resting underline is the point: these links sit
 * inside body copy, where ink against the body grey is not a second cue on its
 * own (WCAG 1.4.1).
 *
 * No font of its own, like the library's: inside prose it takes the prose's.
 * A standalone call to action adds `font-display text-quebi-link` and is
 * written as a lowercase verb phrase ending in →.
 */
export function ProseLink({ className, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "text-quebi-fg underline decoration-1 underline-offset-5",
        "transition-[text-underline-offset] duration-150 ease-out hover:underline-offset-8",
        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
        className,
      )}
    />
  )
}

export interface IndexRow {
  to: string
  title: React.ReactNode
  /** One line under the title, in the running-text grey. */
  description?: React.ReactNode
  /** The caption on the right. */
  meta?: React.ReactNode
  /** The number column. Defaults to the position, zero-padded: 01, 02, …. */
  number?: string
}

/**
 * `IndexList` (`@/components/index-list`) with router links in it.
 *
 * Same rule, same rows, same hover — a strong rule on top, hairlines between,
 * a mono number, the title in Outfit, the meta caption on the right, and a row
 * that shifts right onto the raised ground. It exists for the same reason as
 * {@link ProseLink}: the library's rows are react-aria links, which would turn
 * every click in the catalog into a full page load here.
 *
 * `description` is the one addition: the catalog's rows carry a sentence the
 * library's caption column has no room for.
 */
export function IndexLinkList({ rows, className }: { rows: IndexRow[]; className?: string }) {
  return (
    <ol className={cn("border-quebi-rule border-t", className)}>
      {rows.map((row, position) => (
        <li key={row.to} className="border-quebi-hairline border-b">
          <Link
            to={row.to}
            className={cn(
              "grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3.5 px-1 py-3.5 text-quebi-fg",
              "transition-[padding,background-color] duration-300 ease-out hover:bg-quebi-raised hover:pl-3",
              "outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset",
            )}
          >
            <span className="font-mono text-quebi-fg-subtle text-xs tabular-nums">
              {row.number ?? String(position + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-quebi-title">{row.title}</span>
              {row.description ? (
                <span className="mt-1 line-clamp-2 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
                  {row.description}
                </span>
              ) : null}
            </span>
            {row.meta != null ? (
              <span className="text-right text-quebi-caption text-quebi-fg-subtle">{row.meta}</span>
            ) : (
              <span />
            )}
          </Link>
        </li>
      ))}
    </ol>
  )
}
