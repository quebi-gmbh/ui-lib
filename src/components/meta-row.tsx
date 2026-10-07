import { cn } from "@/lib/utils"

/**
 * MetaRow — quebi design system
 *
 * Small term/value pairs in one wrapping row, as in a gallery page's header:
 * "studio quebi GmbH · people 2 · practice full-stack". A `<dl>`, so each value
 * is announced with its term. Terms in `fg-subtle`, values in `fg`, both at
 * caption size. Three or four pairs, all lowercase. For a longer block of
 * key/value data, or one that needs to line up in columns, use
 * `DescriptionList`.
 */

export interface MetaRowItem {
  /** The term. Lowercase, one or two words. Also the row's key, so keep terms unique. */
  term: string
  value: React.ReactNode
}

export interface MetaRowProps extends Omit<React.HTMLAttributes<HTMLDListElement>, "children"> {
  items: MetaRowItem[]
}

export function MetaRow({ items, className, ...props }: MetaRowProps) {
  return (
    <dl
      data-slot="meta-row"
      className={cn("m-0 flex flex-wrap gap-x-9 gap-y-3 text-quebi-caption", className)}
      {...props}
    >
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-quebi-fg-subtle">{item.term}</dt>
          <dd className="m-0 text-quebi-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
