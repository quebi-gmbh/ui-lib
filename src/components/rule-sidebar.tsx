import { NavLink } from "react-router"
import { ListChecks, Wrench } from "lucide-react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { cn } from "@/lib/utils"
import { groupRules, rulesRegistry } from "@/registry/rules"

/**
 * Nav for the rules section, mirroring ComponentSidebar.
 *
 * Structured by group rather than flat: each group leads with the one-liner it
 * exists to teach, because that sentence is the thing worth remembering and a
 * list of six rule names is not. Within a group the tier is shown as a prefix —
 * the tiers are an order (elements, then their classes, then their values), so
 * they are worth reading in sequence rather than alphabetically.
 */
const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-baseline gap-2 rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150",
    isActive
      ? "bg-quebi-brand/10 font-medium text-quebi-brand"
      : "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg",
  )

export function RuleSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const groups = groupRules()

  return (
    <div className="flex h-full flex-col">
      <NavLink to="/rules" end onClick={onNavigate} className={linkClasses}>
        <ListChecks className="h-4 w-4 self-center" />
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
            <h3 className="quebi-eyebrow mb-1 px-3">{group.title}</h3>
            <p className="mb-2 px-3 text-xs leading-snug text-quebi-fg-subtle">{group.principle}</p>
            <ul className="space-y-0.5">
              {rules.map((rule) => (
                <li key={rule.id}>
                  <NavLink to={`/rules/${rule.id}`} onClick={onNavigate} className={linkClasses}>
                    {rule.tier ? (
                      <span aria-hidden className="w-8 shrink-0 text-xs text-quebi-fg-subtle">
                        T{rule.tier}
                      </span>
                    ) : null}
                    <span className="min-w-0">{rule.navTitle ?? rule.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="quebi-eyebrow mb-2 px-3">Enforcing them</h3>
          <NavLink to="/rules#enforcement" onClick={onNavigate} className={linkClasses}>
            <Wrench className="h-4 w-4 self-center" />
            ESLint config
          </NavLink>
        </div>
      </OverlayScrollbarsComponent>

      <p className="border-quebi-line/10 border-t pt-4 text-xs text-quebi-fg-subtle">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"} in {groups.length} group
        {groups.length === 1 ? "" : "s"}
      </p>
    </div>
  )
}
