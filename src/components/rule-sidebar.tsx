import { NavLink } from "react-router"
import { ListChecks, Wrench } from "lucide-react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { cn } from "@/lib/utils"
import { groupRules, rulesRegistry } from "@/registry/rules"

/**
 * Nav for the rules section — the same shape as ComponentSidebar: a home link,
 * headed groups of plain links, a count. Rules keep their registry order inside
 * a group, which is tier order: elements, then the classes on them, then the
 * values in those classes.
 */
const itemClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150",
    isActive
      ? "bg-quebi-brand/10 font-medium text-quebi-brand"
      : "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
  )

const rootClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150",
    isActive
      ? "bg-quebi-brand/10 font-medium text-quebi-brand"
      : "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
  )

export function RuleSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const groups = groupRules()

  return (
    <div className="flex h-full flex-col">
      <NavLink to="/rules" end onClick={onNavigate} className={rootClasses}>
        <ListChecks className="h-4 w-4" />
        All rules
      </NavLink>

      <OverlayScrollbarsComponent
        element="nav"
        defer
        options={{ scrollbars: { theme: "os-theme-quebi", autoHide: "leave", autoHideDelay: 600 } }}
        className="mt-6 flex-1 space-y-6 pb-6"
      >
        {groups.map(({ group, rules }) => (
          <div key={group.id}>
            <h3 className="quebi-eyebrow mb-2 px-3">{group.title}</h3>
            <ul className="space-y-0.5">
              {rules.map((rule) => (
                <li key={rule.id}>
                  <NavLink to={`/rules/${rule.id}`} onClick={onNavigate} className={itemClasses}>
                    {rule.navTitle ?? rule.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="quebi-eyebrow mb-2 px-3">Enforcing them</h3>
          <NavLink to="/rules#enforcement" onClick={onNavigate} className={rootClasses}>
            <Wrench className="h-4 w-4" />
            Biome config
          </NavLink>
        </div>
      </OverlayScrollbarsComponent>

      <p className="border-quebi-line/10 border-t pt-4 text-xs text-quebi-fg-subtle">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"}
      </p>
    </div>
  )
}
