import { TableOfContents } from "@/components/table-of-contents"

/**
 * The "on this page" rail beside a long page — `/components/:slug` and
 * `/rules/:slug` — and the heading ids it points at.
 *
 * **The items are loader data, not a DOM read.** Each route's loader returns
 * `contents`, built from the same records the page renders its headings from
 * (`metaRegistry`, `rulesRegistry`, the example titles), so the rail is in the
 * prerendered HTML and paints with the frame. `useTableOfContents` would have
 * nothing until after mount, and on a component page most of the headings sit
 * inside lazy chunks that have not arrived yet. The price is that a heading and
 * its item are written in two places; both take their id from the helpers
 * below, and `tests/on-this-page.test.tsx` renders every rule page and a set of
 * component pages and checks that each item finds its heading and each
 * anchored heading has its item.
 *
 * **The scroll-spy state is the rail's own.** `TableOfContents` keeps the
 * current heading in its own state, and nothing here lifts it: the rail is a
 * sibling of the page content, so a scroll re-renders the rail and nothing
 * else. Hoisting it — into this wrapper, the route, or the layout above
 * `<Outlet />` — would re-render the page's Suspense boundaries while they are
 * still dehydrated, and React paints their fallbacks over the prerendered
 * content (`tests/hydration-boundaries.test.tsx`).
 *
 * **The reading line is the rail's top.** Headings carry `ANCHOR`, a
 * `scroll-margin-top` of `--quebi-rail-top` (declared in `root.tsx` to clear
 * the sticky header), so a heading jumped to lands exactly where the rail is
 * pinned — and that is the same 96px the rail's scroll-spy reads from.
 *
 * Shown from `xl` up. Below that the page already shares its width with the
 * section sidebar, and a third column would squeeze the gallery; the rail is
 * still in the HTML for a reader that does not use the layout.
 */
export function OnThisPage({
  contents,
  children,
}: {
  contents: PageSection[]
  children: React.ReactNode
}) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <div className="min-w-0">{children}</div>
      <aside data-slot="on-this-page" className="hidden xl:block">
        <TableOfContents
          items={contents}
          label="On this page"
          className="sticky top-(--quebi-rail-top) max-h-[calc(100dvh-var(--quebi-rail-top)-1.5rem)] overflow-y-auto overscroll-contain"
        />
      </aside>
    </div>
  )
}

/**
 * One entry in the rail. `TableOfContentsItem` with a string title: this
 * crosses the loader boundary, so it has to survive serialization.
 */
export interface PageSection {
  id: string
  title: string
  /** 3 for an h3, nested under the h2 before it. Defaults to 2. */
  level?: number
}

/** What an anchored heading needs so a jump to it clears the sticky header. */
export const ANCHOR = "scroll-mt-(--quebi-rail-top)"

/**
 * A heading id from a title that is not fixed text — an example's, a check's.
 * `prefix` keeps it out of the way of the page's fixed section ids, and the
 * titles in one list are already unique because they are its React keys.
 */
export function headingId(prefix: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${prefix}-${slug}`
}
