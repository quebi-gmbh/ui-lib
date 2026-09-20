import { useMemo, useState } from "react"
import { NavLink, useMatch } from "react-router"
import { LayoutGrid } from "lucide-react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
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

const LINK = "block rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150"
const RESTING = "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg"
const CURRENT = "bg-quebi-brand/10 font-medium text-quebi-brand-text"

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(LINK, isActive ? CURRENT : RESTING)

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

      {/* All components — home base for the catalog */}
      <NavLink
        to="/components"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "mt-4 flex items-center gap-2 rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150",
            isActive ? CURRENT : RESTING,
          )
        }
      >
        <LayoutGrid className="h-4 w-4" />
        All components
      </NavLink>

      {/* Grouped nav */}
      <OverlayScrollbarsComponent
        element="nav"
        defer
        options={{ scrollbars: { theme: "os-theme-quebi", autoHide: "leave", autoHideDelay: 600 } }}
        className="mt-6 flex-1 pb-6"
      >
        {groups.length === 0 ? (
          <p className="text-sm text-quebi-fg-subtle">No components match “{query}”.</p>
        ) : (
          <DisclosureGroup
            allowsMultipleExpanded
            expandedKeys={expandedKeys}
            onExpandedChange={(keys) => setExpandedKeys(new Set([...keys].map(String)))}
            className="gap-0.5"
          >
            {groups.map((group) => (
              <Disclosure key={group.category} id={group.category} variant="plain">
                <DisclosureTrigger>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate">{group.category}</span>
                    <span className="text-quebi-fg-subtle tabular-nums">
                      {group.components.length}
                    </span>
                  </span>
                </DisclosureTrigger>
                <DisclosurePanel>
                  <ul className="space-y-0.5">
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
      </OverlayScrollbarsComponent>

      <p className="border-quebi-line/10 border-t pt-4 text-xs text-quebi-fg-subtle">
        {matches.length} component{matches.length === 1 ? "" : "s"}
      </p>
    </div>
  )
}
