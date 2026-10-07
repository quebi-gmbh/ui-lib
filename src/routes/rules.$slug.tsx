import { Link, data, useParams } from "react-router"
import { Badge } from "@/components/badge"
import { CodeBlock } from "@/site/code-block"
import { ProseLink } from "@/site/prose-link"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { Note } from "@/components/note"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { ANCHOR, headingId, OnThisPage, type PageSection } from "@/site/on-this-page"
import { getRule, getRuleGroup, groupRules, severityIntent } from "@/registry/rules"
import type { RuleMeta } from "@/registry/rules/types"
import { ruleChecks, ruleExampleHighlights } from "@/registry/rules/highlighted.generated"
import type { Route } from "./+types/rules.$slug"

export function loader({ params }: Route.LoaderArgs) {
  const rule = getRule(params.slug)
  if (!rule) throw data("Not found", { status: 404 })
  // Only the serializable fields the meta descriptor and the "on this page"
  // rail need; the page itself reads the full record from the in-memory registry.
  return { id: rule.id, title: rule.title, summary: rule.summary, contents: ruleContents(rule) }
}

/** The page's headings, in page order, for the rail. Ids match the markup below. */
function ruleContents(rule: RuleMeta): PageSection[] {
  const checks = ruleChecks[rule.id] ?? []
  return [
    { id: "catches", title: "what this catches" },
    { id: "why", title: "why" },
    ...(rule.replacements?.length ? [{ id: "instead", title: "use this instead" }] : []),
    ...(rule.classPolicy ? [{ id: "class-test", title: "the class test" }] : []),
    { id: "examples", title: "wrong / right" },
    ...rule.examples.map((example) => ({
      id: headingId("example", example.title),
      title: example.title,
      level: 3,
    })),
    ...(checks.length > 0
      ? [
          { id: "checks", title: "how to check this" },
          ...checks.map((check) => ({ id: headingId("check", check.title), title: check.title, level: 3 })),
        ]
      : []),
    { id: "exceptions", title: "exceptions" },
    { id: "scope", title: "scope and enforcement" },
  ]
}

export function meta({ loaderData: d }: Route.MetaArgs) {
  if (!d) return seo({ title: "Not found", description: "Rule not found.", path: "/rules" })
  return seo({ title: d.title, description: d.summary, path: `/rules/${d.id}` })
}

/** The rule's number in nav order — group, then tier — as on the index: "03". */
function ruleNumber(id: string) {
  const index = groupRules()
    .flatMap(({ rules }) => rules)
    .findIndex((r) => r.id === id)
  return String(index + 1).padStart(2, "0")
}

/**
 * Replacements name a JSX element ("button", "Checkbox") or a situation
 * ("Everything else (Slider, TagField, …)"). Only the former reads right in
 * angle brackets.
 */
function replacementLabel(element: string) {
  return /^[A-Za-z][A-Za-z0-9.]*$/.test(element) ? `<${element}>` : element
}

export default function RuleDetail({ loaderData }: Route.ComponentProps) {
  const { slug } = useParams()
  const rule = getRule(slug)
  const group = rule ? getRuleGroup(rule.category) : undefined
  const highlights = rule ? (ruleExampleHighlights[rule.id] ?? []) : []
  const checks = rule ? (ruleChecks[rule.id] ?? []) : []

  if (!rule) return null

  return (
    <OnThisPage contents={loaderData.contents}>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-quebi-caption text-quebi-fg-subtle">
          <li>
            <Link
              to="/rules"
              className="text-quebi-fg-muted underline-offset-5 transition-colors duration-150 hover:text-quebi-fg hover:underline"
            >
              rules
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-quebi-fg" aria-current="page">
            {rule.navTitle ?? rule.title}
          </li>
        </ol>
      </nav>

      <header className="mt-quebi-8">
        <p className="quebi-eyebrow">
          rule {ruleNumber(rule.id)} — {rule.tier ? `tier ${rule.tier}` : group?.title.toLowerCase()}
        </p>
        <h1 className="mt-3 font-display text-quebi-display-m text-quebi-fg">{rule.title}</h1>
        <p className="mt-5 max-w-[60ch] text-quebi-body text-quebi-fg-muted">{rule.summary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          <Badge intent={severityIntent(rule.severity)}>{rule.severity}</Badge>
          <Badge>{rule.enforcement.kind}</Badge>
          <Code className="ms-2">{rule.id}</Code>
        </div>
        {group ? (
          <div className="mt-quebi-8 max-w-[60ch] border-quebi-rule border-t pt-4">
            <p className="quebi-eyebrow">{group.title.toLowerCase()}</p>
            <p className="mt-2 font-display text-quebi-fg text-quebi-title">{group.principle}</p>
          </div>
        ) : null}
      </header>

      <section className="mt-quebi-9">
        <h2 id="catches" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          what this catches
        </h2>
        <Note intent="warning" className="mt-3">
          {rule.failureMode}
        </Note>
      </section>

      <section className="mt-quebi-9">
        <h2 id="why" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          why
        </h2>
        <div className="mt-3 space-y-4">
          {rule.rationale.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="max-w-[60ch] text-quebi-body text-quebi-fg-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {rule.replacements?.length ? (
        <section className="mt-quebi-9">
          <h2 id="instead" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          use this instead
        </h2>
          <DescriptionList className="mt-5">
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
                          <ProseLink to={`/components/${target.slug}`}>
                            {target.name}
                          </ProseLink>
                        ) : (
                          <span className="text-quebi-fg">{target.name}</span>
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
        <section className="mt-quebi-9">
          <h2 id="class-test" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          the class test
        </h2>
          <div className="mt-5 grid border-quebi-rule border-t sm:grid-cols-2">
            <div className="py-4 sm:me-5 sm:border-quebi-hairline sm:border-e sm:pe-5">
              <h3 className="font-mono text-quebi-label text-quebi-success uppercase">allowed</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {rule.classPolicy.allowed.map((prefix) => (
                  <li key={prefix}>
                    <Badge intent="success">{prefix}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-quebi-hairline border-t py-4 sm:border-t-0">
              <h3 className="font-mono text-quebi-danger text-quebi-label uppercase">violating</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {rule.classPolicy.violating.map((prefix) => (
                  <li key={prefix}>
                    <Badge intent="danger">{prefix}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {rule.classPolicy.note ? (
            <p className="mt-4 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
              {rule.classPolicy.note}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-quebi-9">
        <h2 id="examples" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          wrong / right
        </h2>
        <div className="mt-6 space-y-quebi-8">
          {rule.examples.map((example, i) => (
            <article key={example.title}>
              <h3
                id={headingId("example", example.title)}
                className={cn(ANCHOR, "font-display text-quebi-fg text-quebi-title")}
              >
                {example.title}
              </h3>
              {example.source ? (
                <p className="mt-1 text-quebi-caption text-quebi-fg-subtle">
                  {example.sourceFixed ? "Was real code in " : "Real code from "}
                  <Code>{example.source}</Code>
                  {example.sourceFixed ? ", until it was fixed" : null}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 font-mono text-quebi-danger text-quebi-label uppercase">don't</p>
                  <CodeBlock html={highlights[i]?.wrong ?? ""} code={example.wrong} />
                </div>
                <div>
                  <p className="mb-2 font-mono text-quebi-label text-quebi-success uppercase">do</p>
                  <CodeBlock html={highlights[i]?.right ?? ""} code={example.right} />
                </div>
              </div>
              {example.note ? (
                <p className="mt-3 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
                  {example.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {checks.length > 0 ? (
        <section className="mt-quebi-9">
          <h2 id="checks" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          how to check this
        </h2>
          <p className="mt-1 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
            Add one of these to your project and the rule holds without anyone having to remember
            it — including the agent writing half the JSX. The exceptions below are already applied,
            so a documented carve-out will not be reported.
          </p>
          {rule.enforcement.note ? (
            <p className="mt-3 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
              <span className="text-quebi-fg">What it will and will not catch: </span>
              {rule.enforcement.note}
            </p>
          ) : null}
          <div className="mt-6 space-y-quebi-8">
            {checks.map((check) => (
              <article key={check.title}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id={headingId("check", check.title)}
                    className={cn(ANCHOR, "font-display text-quebi-fg text-quebi-title")}
                  >
                    {check.title}
                  </h3>
                  <Badge>{check.tool}</Badge>
                </div>
                <p className="mt-1 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
                  {check.description}
                </p>
                <div className="mt-3">
                  <CodeBlock html={check.highlighted} code={check.code} />
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-quebi-body-s text-quebi-fg-muted">
            Enforcing more than this one rule?{" "}
            <ProseLink to="/rules/enforcement">
              Take the whole config
            </ProseLink>{" "}
            instead of collecting snippets.
          </p>
        </section>
      ) : null}

      <section className="mt-quebi-9">
        <h2 id="exceptions" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          exceptions
        </h2>
        <p className="mt-1 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
          Carve-outs are part of the rule, not a way around it. Each one is already an ignore glob
          in the checks above, so the cases listed here need no disable comment — and a case that is
          not listed is one to argue for, not to silence.
        </p>
        <div className="mt-4 space-y-3">
          {/* A rule can legitimately have none, and an empty heading reads like
              a page that failed to load. Say it instead: no exceptions is a
              claim about the rule, not a gap in the record. */}
          {rule.exceptions.length === 0 ? (
            <Note intent="success" title="None">
              Every case this rule covers has a replacement that is an import, so there is nothing
              here that a documented carve-out would be honest about. A case it gets wrong is one to
              argue for on the record, not to silence with a suppression comment.
            </Note>
          ) : (
            rule.exceptions.map((exception) => (
              <Note key={exception.scope} intent="warning" title={exception.scope}>
                {exception.reason}
              </Note>
            ))
          )}
        </div>
      </section>

      <section className="mt-quebi-9">
        <h2 id="scope" className={cn(ANCHOR, "font-display text-quebi-display-s text-quebi-fg")}>
          scope and enforcement
        </h2>
        <DescriptionList className="mt-5">
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
    </OnThisPage>
  )
}
