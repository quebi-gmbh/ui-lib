import { useMemo, useState } from "react"
import { NavLink } from "react-router"
import { LayoutGrid } from "lucide-react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { SearchField, SearchInput } from "@/components/search-field"
import { cn } from "@/lib/utils"
import { registry } from "@/registry"
import { filterComponents, groupByCategory } from "@/registry/grouping"

export function ComponentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("")

  const groups = useMemo(() => groupByCategory(filterComponents(query, registry)), [query])
  const total = useMemo(() => filterComponents(query, registry).length, [query])

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
            isActive
              ? "bg-quebi-brand/10 font-medium text-quebi-brand"
              : "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
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
        className="mt-6 flex-1 space-y-6 pb-6"
      >
        {groups.length === 0 ? (
          <p className="text-sm text-quebi-fg-subtle">No components match “{query}”.</p>
        ) : (
          groups.map((group) => (
            <div key={group.category}>
              <h3 className="quebi-eyebrow mb-2 px-3">{group.category}</h3>
              <ul className="space-y-0.5">
                {group.components.map((c) => (
                  <li key={c.slug}>
                    <NavLink
                      to={`/components/${c.slug}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "block rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150",
                          isActive
                            ? "bg-quebi-brand/10 font-medium text-quebi-brand"
                            : "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
                        )
                      }
                    >
                      {c.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </OverlayScrollbarsComponent>

      <p className="border-quebi-line/10 border-t pt-4 text-xs text-quebi-fg-subtle">
        {total} component{total === 1 ? "" : "s"}
      </p>
    </div>
  )
}
