import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card, CardDescription, CardTitle } from "@/components/card"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import {
  failureModes,
  groupRules,
  RULES_LEDE,
  rulesRegistry,
  severityIntent,
  whyLintNotInstructions,
} from "@/registry/rules"

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
    <div>
      <span className="quebi-eyebrow">Guidelines</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">Rules</h1>
      <p className="mt-4 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"} for building an app with
        ui-lib components. Each one names what to import instead of what it forbids, shows a real
        wrong/right pair, and ships a check you can run in your own project. Agents can read the
        same rules as JSON from <Code>/api/rules.json</Code>.
      </p>

      <section className="mt-12">
        <h2 className="quebi-eyebrow mb-4">Why these exist</h2>
        <p className="max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
          {RULES_LEDE}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {failureModes.map((mode) => (
            <Card key={mode.id}>
              <CardTitle className="text-base">{mode.title}</CardTitle>
              <CardDescription className="mt-2">{mode.body}</CardDescription>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {mode.ruleIds.map((id) => (
                  <li key={id}>
                    <Link to={`/rules/${id}`}>
                      <Badge intent="outline">
                        {rulesRegistry.find((r) => r.id === id)?.navTitle ?? id}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-quebi-fg">
            {whyLintNotInstructions.title}
          </h3>
          <DescriptionList className="mt-3">
            {whyLintNotInstructions.points.map((point) => (
              <div key={point.title} className="contents">
                <DescriptionTerm>{point.title}</DescriptionTerm>
                <DescriptionDetails>{point.body}</DescriptionDetails>
              </div>
            ))}
          </DescriptionList>
        </div>
      </section>

      <div className="mt-16 space-y-16">
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

      <section className="mt-16">
        <Link to="/rules/enforcement" className="group block">
          <Card interactive>
            <div className="flex flex-wrap items-center gap-2">
              <Badge intent="brand">Enforcement</Badge>
            </div>
            <CardTitle className="mt-3">Run these in your own project</CardTitle>
            <CardDescription className="mt-2">
              All {rulesRegistry.length} rules as one Biome config, with a GritQL plugin for each
              rule Biome has no built-in for and the documented exceptions already applied.
            </CardDescription>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-quebi-brand transition-colors duration-200 group-hover:text-quebi-brand-hover">
              Set it up <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>
      </section>
    </div>
  )
}
