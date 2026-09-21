import { NavLink } from "react-router"
import { ListChecks, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { groupRules, rulesRegistry } from "@/registry/rules"
import { NAV_PENDING } from "@/site/navigation-status"
import { ScrollSurface } from "@/site/scroll-surface"

/**
 * Nav for the rules section — a home link, headed groups of plain links, a
 * count. Rules keep their registry order inside a group, which is tier order:
 * elements, then the classes on them, then the values in those classes.
 *
 * It used to be the same shape as ComponentSidebar and deliberately so. It no
 * longer is: ComponentSidebar collapses its groups because it has 140 entries
 * in thirteen categories and did not fit on a screen. Fourteen rules in four
 * groups do fit, and hiding them behind a click would cost a reader the one
 * view that shows the whole rule set at once. If the rules grow past a screen,
 * the two shapes should converge again.
 */
const BASE = "rounded-quebi-sm px-3 py-1.5 text-sm transition-colors duration-150"
const RESTING = "text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg"
const CURRENT = "bg-quebi-brand/10 font-medium text-quebi-brand-text"

/** The pending state is ComponentSidebar's; see NAV_PENDING for what it is for. */
const itemClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn("block", BASE, isActive ? CURRENT : isPending ? NAV_PENDING : RESTING)

const rootClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn("flex items-center gap-2", BASE, isActive ? CURRENT : isPending ? NAV_PENDING : RESTING)

export function RuleSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const groups = groupRules()

  return (
    <div className="flex h-full flex-col">
      <NavLink to="/rules" end onClick={onNavigate} className={rootClasses}>
        <ListChecks className="h-4 w-4" />
        All rules
      </NavLink>

      <ScrollSurface element="nav" className="mt-6 flex-1 space-y-6 pb-6">
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
          <NavLink to="/rules/enforcement" onClick={onNavigate} className={rootClasses}>
            <Wrench className="h-4 w-4" />
            Biome config
          </NavLink>
        </div>
      </ScrollSurface>

      <p className="border-quebi-line/10 border-t pt-4 text-xs text-quebi-fg-subtle">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"}
      </p>
    </div>
  )
}
