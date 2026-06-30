import { useMemo, useState } from "react"
import { NavLink } from "react-router"
import { LayoutGrid, Search } from "lucide-react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
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
      <div className="relative">
        <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-quebi-fg-subtle" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components"
          aria-label="Search components"
          className="w-full rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02] py-2 pr-3 pl-9 text-sm text-white placeholder:text-quebi-fg-subtle transition-colors duration-200 focus:border-quebi-brand focus:outline-none"
        />
      </div>

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
              : "text-quebi-fg-muted hover:bg-white/[0.04] hover:text-white",
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
                            : "text-quebi-fg-muted hover:bg-white/[0.04] hover:text-white",
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

      <p className="border-cyan-500/10 border-t pt-4 text-xs text-quebi-fg-subtle">
        {total} component{total === 1 ? "" : "s"}
      </p>
    </div>
  )
}
