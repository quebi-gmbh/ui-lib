import { useMemo, useState } from "react"
import { NavLink, useMatch } from "react-router"
import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/disclosure-group"
import { SearchField, SearchInput } from "@/components/search-field"
import { cn } from "@/lib/utils"
import { metaRegistry } from "@/registry/meta"
import { filterComponents, groupByCategory } from "@/registry/grouping"
import { NAV_PENDING } from "@/site/navigation-status"
import { ScrollSurface } from "@/site/scroll-surface"

/**
 * A component link sits on the group's hairline track (the `border-s` on its
 * list) and draws its own 1px edge over it with `-ms-px`: transparent at rest,
 * ink when it is the page you are on. No fill, no box — the mark and the ink
 * are the whole current state.
 */
const LINK = "-ms-px block border-s py-1 ps-3 text-sm transition-colors duration-150"
const RESTING = "border-transparent text-quebi-fg-muted hover:text-quebi-fg"
const CURRENT = "border-quebi-fg text-quebi-fg"

/** The section's own pages above the groups: the design's nav role, underlined when current. */
const PAGE_LINK =
  "block px-3 py-1 font-display text-quebi-nav underline-offset-5 decoration-1 transition-colors duration-150 hover:underline"
const PAGE_RESTING = "text-quebi-fg-muted hover:text-quebi-fg"
const PAGE_CURRENT = "text-quebi-fg underline"

const pageLinkClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(PAGE_LINK, isActive ? PAGE_CURRENT : isPending ? NAV_PENDING : PAGE_RESTING)

/**
 * Three states, in the order they win: the page you are on, the page you are
 * waiting for, the pages you are not. `isPending` is react-router's — it is set
 * on exactly the link whose URL the in-flight navigation is headed for — so the
 * nav says which link is loading without anything here tracking it.
 */
const linkClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(LINK, isActive ? CURRENT : isPending ? cn("border-transparent", NAV_PENDING) : RESTING)

/**
 * Nav for the component catalog: a search box, a home link, and one collapsible
 * group per category.
 *
 * Every group starts collapsed — 140 components in thirteen open groups was a
 * single scroller taller than the viewport, which is what this sidebar used to
 * be. Two things open a group anyway, because a collapsed nav that hides what
 * you are looking at is worse than a long one:
 *
 * - the group holding the component you are on, so the current page is visible
 *   in its own nav;
 * - every group with a hit while a search is running, so typing shows results
 *   rather than a list of category headings.
 *
 * Both are handled by the state sync below rather than by an effect: the site
 * is prerendered, and an effect that expanded a group after mount would render
 * the closed version into the HTML and reopen it on hydration. Nothing is
 * persisted for the same reason — reading localStorage during render is a
 * hydration mismatch, and the sidebar is mounted by the layout route, so what
 * you open survives navigation within /components regardless.
 */
export function ComponentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("")

  const matches = useMemo(() => filterComponents(query, metaRegistry), [query])
  const groups = useMemo(() => groupByCategory(matches), [matches])

  const slug = useMatch("/components/:slug")?.params.slug
  const activeCategory = slug ? metaRegistry.find((c) => c.slug === slug)?.category : undefined

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(activeCategory ? [activeCategory] : []),
  )
  // Derive-during-render rather than useEffect: this runs before the commit, so
  // the group is already open in the first paint after a search or a navigation.
  const [seen, setSeen] = useState({ query, activeCategory })
  if (seen.query !== query || seen.activeCategory !== activeCategory) {
    let next: Set<string>
    if (seen.query !== query) {
      // A search opens what it found; clearing it returns to the current page.
      next = query.trim()
        ? new Set(groups.map((g) => g.category))
        : new Set(activeCategory ? [activeCategory] : [])
    } else {
      next = new Set(expandedKeys)
    }
    if (seen.activeCategory !== activeCategory && activeCategory) next.add(activeCategory)
    setSeen({ query, activeCategory })
    setExpandedKeys(next)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <SearchField aria-label="Search components" value={query} onChange={setQuery}>
        <SearchInput placeholder="Search components" />
      </SearchField>

      {/* All components — home base for the catalog — then the written pages
          in this section. Those are not registry slugs, so they cannot arrive
          through the grouped nav below — which is built from metaRegistry and
          has no entry to put them in. */}
      <div className="mt-6 flex flex-col">
        <NavLink to="/components" end onClick={onNavigate} className={pageLinkClasses}>
          all components
        </NavLink>
        <NavLink to="/components/focus" onClick={onNavigate} className={pageLinkClasses}>
          focus indicators
        </NavLink>
      </div>

      {/* Grouped nav */}
      <ScrollSurface element="nav" className="mt-6 flex-1 pb-6">
        {groups.length === 0 ? (
          <p className="px-3 text-quebi-body-s text-quebi-fg-muted">No components match “{query}”.</p>
        ) : (
          <DisclosureGroup
            allowsMultipleExpanded
            expandedKeys={expandedKeys}
            onExpandedChange={(keys) => setExpandedKeys(new Set([...keys].map(String)))}
            className="gap-1"
          >
            {groups.map((group) => (
              <Disclosure key={group.category} id={group.category} variant="plain">
                <DisclosureTrigger>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate">{group.category}</span>
                    <span className="tabular-nums">
                      {group.components.length}
                    </span>
                  </span>
                </DisclosureTrigger>
                <DisclosurePanel>
                  <ul className="ms-3 border-quebi-hairline border-s">
                    {group.components.map((c) => (
                      <li key={c.slug}>
                        <NavLink
                          to={`/components/${c.slug}`}
                          onClick={onNavigate}
                          className={linkClasses}
                        >
                          {c.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </DisclosureGroup>
        )}
      </ScrollSurface>

      <p className="border-quebi-hairline border-t px-3 pt-4">
        <span className="quebi-eyebrow">
          {matches.length} component{matches.length === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  )
}
