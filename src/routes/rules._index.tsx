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
  biomeConfigHighlighted,
  biomeConfigSource,
  biomeSetupHighlighted,
  biomeSetupSource,
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
    <div>
      <span className="quebi-eyebrow">Guidelines</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">Rules</h1>
      <p className="mt-4 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"} for building an app with
        ui-lib components. Each one names what to import instead of what it forbids, shows a real
        wrong/right pair, and ships a check you can run in your own project. Agents can read the
        same rules as JSON from <Code>/api/rules.json</Code>.
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

      <section id="enforcement" className="mt-20 scroll-mt-24">
        <h2 className="quebi-eyebrow mb-4">Enforcement</h2>
        <h3 className="text-2xl font-semibold tracking-tight text-quebi-fg">
          Run the rules, don't just read them
        </h3>
        <p className="mt-3 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
          Every rule on this page as one Biome config, exceptions included. It is rebuilt from these
          rules whenever they change, so re-download it rather than maintaining a copy by hand — that
          way a rule we sharpen reaches your CI. Enforcing one rule at a time? Each rule's page
          carries its own snippet, plus a <Code>ripgrep</Code> one-liner for projects with no linter
          at all.
        </p>

        <Note intent="info" className="mt-6">
          Nothing to install from us beyond Biome itself, which parses TSX with no parser to
          configure. Two rules of the six are Biome's own; the rest ship as GritQL plugin files you
          save next to the config. You own all of it once it lands — soften a rule to{" "}
          <Code>warn</Code>, scope it with <Code>overrides</Code>, or drop an entry you disagree
          with.
        </Note>

        <div className="mt-8">
          <h4 className="text-base font-semibold text-quebi-fg">Wire it up</h4>
          <div className="mt-3">
            <CodeBlock html={biomeSetupHighlighted} code={biomeSetupSource} />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-semibold text-quebi-fg">
              biome.jsonc — all {rulesRegistry.length} rules
            </h4>
            <UiLink
              href="/api/rules/biome.jsonc"
              className="inline-flex items-center gap-1.5 text-sm font-medium"
            >
              <FileCode className="h-4 w-4" />
              /api/rules/biome.jsonc
            </UiLink>
          </div>
          <div className="mt-3">
            <CodeBlock html={biomeConfigHighlighted} code={biomeConfigSource} />
          </div>
        </div>
      </section>
    </div>
  )
}
