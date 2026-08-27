import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card, CardDescription, CardTitle } from "@/components/card"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { groupRules, rulesRegistry, severityIntent } from "@/registry/rules"

export function meta() {
  return seo({
    title: "Rules",
    description:
      "When a raw HTML element is allowed in an app that uses quebi ui-lib, and which component to import when it is not. Layout is yours; appearance is the library's.",
    path: "/rules",
  })
}

export default function Rules() {
  const groups = groupRules()

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <span className="quebi-eyebrow">Guidelines</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">Rules</h1>
      <p className="mt-4 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"} for writing code against
        ui-lib. Each one names what to import instead of what it forbids, cites a real wrong/right
        pair, and carries its own exceptions. They are records, not prose — the same data is served
        at <Code>/api/rules.json</Code> for agents.
      </p>

      <div className="mt-12 space-y-16">
        {groups.map(({ group, rules }) => (
          <section key={group.id}>
            <h2 className="quebi-eyebrow mb-4">{group.title}</h2>

            <Card variant="feature">
              <CardTitle className="text-2xl">{group.principle}</CardTitle>
              <CardDescription className="mt-3">{group.description}</CardDescription>
            </Card>

            <ul className="mt-8 space-y-6">
              {rules.map((rule) => (
                <li key={rule.id}>
                  <Link to={`/rules/${rule.id}`} className="group block">
                    <Card interactive>
                      <div className="flex flex-wrap items-center gap-2">
                        {rule.tier ? <Badge intent="brand">Tier {rule.tier}</Badge> : null}
                        <Badge intent={severityIntent(rule.severity)}>{rule.severity}</Badge>
                        <Badge intent="outline">{rule.enforcement.kind}</Badge>
                      </div>
                      <CardTitle className="mt-3">{rule.title}</CardTitle>
                      <CardDescription className="mt-2">{rule.summary}</CardDescription>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-quebi-brand transition-colors duration-200 group-hover:text-quebi-brand-hover">
                        Read the rule <ArrowRight className="h-4 w-4" />
                      </span>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
