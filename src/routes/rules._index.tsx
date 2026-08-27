import { Link } from "react-router"
import { ArrowRight, FileCode } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card, CardDescription, CardTitle } from "@/components/card"
import { CodeBlock } from "@/components/code-block"
import { Link as UiLink } from "@/components/link"
import { Note } from "@/components/note"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { groupRules, rulesRegistry, severityIntent } from "@/registry/rules"
import {
  eslintConfigHighlighted,
  eslintConfigSource,
  eslintSetupHighlighted,
  eslintSetupSource,
} from "@/registry/rules/highlighted.generated"

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

      <section className="mt-20">
        <h2 className="quebi-eyebrow mb-4">Enforcement</h2>
        <h3 className="text-2xl font-semibold tracking-tight text-quebi-fg">
          Run the rules, don't just read them
        </h3>
        <p className="mt-3 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
          The config below is generated from the same records this page renders — every selector,
          message and exception comes from a rule, so the check you run and the rule you read cannot
          drift apart. Each rule's page carries its own snippet, plus a{" "}
          <Code>ripgrep</Code> one-liner for repos with no linter at all.
        </p>

        <Note intent="info" className="mt-6">
          ui-lib itself ships no lint setup — there is no ESLint, oxlint or biome config in this
          repo, so nothing here is enforced on the library's own source yet. The config is published
          as an artifact for the apps that consume ui-lib.
        </Note>

        <div className="mt-8">
          <h4 className="text-base font-semibold text-quebi-fg">Wire it up</h4>
          <div className="mt-3">
            <CodeBlock html={eslintSetupHighlighted} code={eslintSetupSource} />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-semibold text-quebi-fg">
              eslint.config.js — all {rulesRegistry.length} rules
            </h4>
            <UiLink
              href="/api/rules/eslint.config.js"
              className="inline-flex items-center gap-1.5 text-sm font-medium"
            >
              <FileCode className="h-4 w-4" />
              /api/rules/eslint.config.js
            </UiLink>
          </div>
          <div className="mt-3">
            <CodeBlock html={eslintConfigHighlighted} code={eslintConfigSource} />
          </div>
        </div>
      </section>
    </div>
  )
}
