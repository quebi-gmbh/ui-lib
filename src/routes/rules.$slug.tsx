import { Link, data, useParams } from "react-router"
import { Check, ChevronRight, X } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card, CardTitle } from "@/components/card"
import { CodeBlock } from "@/components/code-block"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { Note } from "@/components/note"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { getRule, getRuleGroup, severityIntent } from "@/registry/rules"
import { ruleChecks, ruleExampleHighlights } from "@/registry/rules/highlighted.generated"
import type { Route } from "./+types/rules.$slug"

export function loader({ params }: Route.LoaderArgs) {
  const rule = getRule(params.slug)
  if (!rule) throw data("Not found", { status: 404 })
  // Only the serializable fields the meta descriptor needs; the page itself
  // reads the full record from the in-memory registry.
  return { id: rule.id, title: rule.title, summary: rule.summary }
}

export function meta({ loaderData: d }: Route.MetaArgs) {
  if (!d) return seo({ title: "Not found", description: "Rule not found.", path: "/rules" })
  return seo({ title: d.title, description: d.summary, path: `/rules/${d.id}` })
}

/**
 * Replacements name a JSX element ("button", "Checkbox") or a situation
 * ("Everything else (Slider, TagField, …)"). Only the former reads right in
 * angle brackets.
 */
function replacementLabel(element: string) {
  return /^[A-Za-z][A-Za-z0-9.]*$/.test(element) ? `<${element}>` : element
}

export default function RuleDetail() {
  const { slug } = useParams()
  const rule = getRule(slug)
  const group = rule ? getRuleGroup(rule.category) : undefined
  const highlights = rule ? (ruleExampleHighlights[rule.id] ?? []) : []
  const checks = rule ? (ruleChecks[rule.id] ?? []) : []

  if (!rule) return null

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-quebi-fg-subtle">
          <li>
            <Link
              to="/rules"
              className="text-quebi-fg-muted transition-colors duration-200 hover:text-quebi-fg"
            >
              Rules
            </Link>
          </li>
          <li aria-hidden className="flex items-center">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="font-medium text-quebi-fg" aria-current="page">
            {rule.title}
          </li>
        </ol>
      </nav>

      <header className="mt-6">
        {group ? <span className="quebi-eyebrow">{group.title}</span> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">
          {rule.title}
        </h1>
        <p className="mt-3 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
          {rule.summary}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {rule.tier ? <Badge intent="brand">Tier {rule.tier}</Badge> : null}
          <Badge intent={severityIntent(rule.severity)}>{rule.severity}</Badge>
          <Badge intent="outline">{rule.enforcement.kind}</Badge>
          <Code>{rule.id}</Code>
        </div>
        {group ? (
          <p className="mt-6 text-lg font-medium text-quebi-brand">{group.principle}</p>
        ) : null}
      </header>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">What this catches</h2>
        <Note intent="warning" className="mt-3">
          {rule.failureMode}
        </Note>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">Why</h2>
        <div className="mt-3 space-y-4">
          {rule.rationale.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {rule.replacements?.length ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-quebi-fg">Use this instead</h2>
          <DescriptionList className="mt-4">
            {rule.replacements.map((replacement) => (
              <div key={replacement.element} className="contents">
                <DescriptionTerm>
                  <Code>{replacementLabel(replacement.element)}</Code>
                </DescriptionTerm>
                <DescriptionDetails>
                  <ul className="space-y-2">
                    {replacement.use.map((target) => (
                      <li key={`${target.from}-${target.name}`}>
                        {target.slug ? (
                          <Link
                            to={`/components/${target.slug}`}
                            className="font-medium text-quebi-brand transition-colors duration-200 hover:text-quebi-brand-hover"
                          >
                            {target.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-quebi-fg">{target.name}</span>
                        )}{" "}
                        <span className="text-quebi-fg-subtle">from {target.from}</span>
                        {target.when ? (
                          <span className="block text-quebi-fg-muted">{target.when}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {replacement.note ? (
                    <p className="mt-2 text-quebi-fg-subtle">{replacement.note}</p>
                  ) : null}
                </DescriptionDetails>
              </div>
            ))}
          </DescriptionList>
        </section>
      ) : null}

      {rule.classPolicy ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-quebi-fg">The class test</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardTitle className="flex items-center gap-2 text-base">
                <Check className="h-4 w-4 text-quebi-success" aria-hidden />
                Allowed
              </CardTitle>
              <ul className="mt-3 flex flex-wrap gap-2">
                {rule.classPolicy.allowed.map((prefix) => (
                  <li key={prefix}>
                    <Badge intent="success">{prefix}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardTitle className="flex items-center gap-2 text-base">
                <X className="h-4 w-4 text-quebi-danger" aria-hidden />
                Violating
              </CardTitle>
              <ul className="mt-3 flex flex-wrap gap-2">
                {rule.classPolicy.violating.map((prefix) => (
                  <li key={prefix}>
                    <Badge intent="danger">{prefix}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          {rule.classPolicy.note ? (
            <p className="mt-4 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
              {rule.classPolicy.note}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">Wrong / right</h2>
        <div className="mt-4 space-y-10">
          {rule.examples.map((example, i) => (
            <article key={example.title}>
              <h3 className="text-base font-semibold text-quebi-fg">{example.title}</h3>
              {example.source ? (
                <p className="mt-1 text-sm text-quebi-fg-subtle">
                  Real code from <Code>{example.source}</Code>
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-quebi-danger">
                    <X className="h-3.5 w-3.5" aria-hidden /> Don't
                  </p>
                  <CodeBlock html={highlights[i]?.wrong ?? ""} code={example.wrong} />
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-quebi-success">
                    <Check className="h-3.5 w-3.5" aria-hidden /> Do
                  </p>
                  <CodeBlock html={highlights[i]?.right ?? ""} code={example.right} />
                </div>
              </div>
              {example.note ? (
                <p className="mt-3 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
                  {example.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {checks.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-quebi-fg">How to check this</h2>
          <p className="mt-1 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
            Add one of these to your project and the rule holds without anyone having to remember
            it — including the agent writing half the JSX. The exceptions below are already applied,
            so a documented carve-out will not be reported.
          </p>
          {rule.enforcement.note ? (
            <p className="mt-3 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
              <span className="text-quebi-fg">What it will and will not catch: </span>
              {rule.enforcement.note}
            </p>
          ) : null}
          <div className="mt-6 space-y-8">
            {checks.map((check) => (
              <article key={check.title}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-quebi-fg">{check.title}</h3>
                  <Badge intent="outline">{check.tool}</Badge>
                </div>
                <p className="mt-1 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
                  {check.description}
                </p>
                <div className="mt-3">
                  <CodeBlock html={check.highlighted} code={check.code} />
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-quebi-fg-muted">
            Enforcing more than this one rule?{" "}
            <Link
              to="/rules/enforcement"
              className="font-medium text-quebi-brand transition-colors duration-200 hover:text-quebi-brand-hover"
            >
              Take the whole config
            </Link>{" "}
            instead of collecting snippets.
          </p>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">Exceptions</h2>
        <p className="mt-1 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
          Carve-outs are part of the rule, not a way around it. Each one is already an ignore glob
          in the checks above, so the cases listed here need no disable comment — and a case that is
          not listed is one to argue for, not to silence.
        </p>
        <div className="mt-4 space-y-3">
          {rule.exceptions.map((exception) => (
            <Note key={exception.scope} intent="warning" title={exception.scope}>
              {exception.reason}
            </Note>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">Scope and enforcement</h2>
        <DescriptionList className="mt-4">
          <DescriptionTerm>Applies to</DescriptionTerm>
          <DescriptionDetails>
            <ul className="flex flex-wrap gap-2">
              {rule.appliesTo.map((glob) => (
                <li key={glob}>
                  <Code>{glob}</Code>
                </li>
              ))}
            </ul>
          </DescriptionDetails>

          <DescriptionTerm>Enforced by</DescriptionTerm>
          <DescriptionDetails>{rule.enforcement.kind}</DescriptionDetails>
        </DescriptionList>
      </section>
    </div>
  )
}
