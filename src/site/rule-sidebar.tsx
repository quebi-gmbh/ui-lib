import { NavLink } from "react-router"
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
 * in thirteen categories and did not fit on a screen. Fifteen rules in four
 * groups do fit, and hiding them behind a click would cost a reader the one
 * view that shows the whole rule set at once. If the rules grow past a screen,
 * the two shapes should converge again.
 */
/** A rule link on its group's hairline track; the same marks as ComponentSidebar's. */
const ITEM = "-ms-px block border-s py-1 ps-3 text-sm transition-colors duration-150"
const RESTING = "border-transparent text-quebi-fg-muted hover:text-quebi-fg"
const CURRENT = "border-quebi-fg text-quebi-fg"

/** The section's own pages: the design's nav role, underlined when current. */
const ROOT =
  "block px-3 py-1 font-display text-quebi-nav underline-offset-5 decoration-1 transition-colors duration-150 hover:underline"
const ROOT_RESTING = "text-quebi-fg-muted hover:text-quebi-fg"
const ROOT_CURRENT = "text-quebi-fg underline"

/** The pending state is ComponentSidebar's; see NAV_PENDING for what it is for. */
const itemClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(ITEM, isActive ? CURRENT : isPending ? cn("border-transparent", NAV_PENDING) : RESTING)

const rootClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(ROOT, isActive ? ROOT_CURRENT : isPending ? NAV_PENDING : ROOT_RESTING)

export function RuleSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const groups = groupRules()

  return (
    <div className="flex h-full flex-col">
      <NavLink to="/rules" end onClick={onNavigate} className={rootClasses}>
        all rules
      </NavLink>

      <ScrollSurface element="nav" className="mt-6 flex-1 space-y-7 pb-6">
        {groups.map(({ group, rules }) => (
          <div key={group.id}>
            <h3 className="quebi-eyebrow mb-2 px-3">{group.title}</h3>
            <ul className="ms-3 border-quebi-hairline border-s">
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
          <h3 className="quebi-eyebrow mb-2 px-3">enforcing them</h3>
          <NavLink to="/rules/enforcement" onClick={onNavigate} className={rootClasses}>
            biome config
          </NavLink>
        </div>
      </ScrollSurface>

      <p className="border-quebi-hairline border-t px-3 pt-4">
        <span className="quebi-eyebrow">
          {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  )
}
