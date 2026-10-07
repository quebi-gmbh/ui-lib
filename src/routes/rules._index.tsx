import { Link } from "react-router"
import { Badge } from "@/components/badge"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { IndexLinkList, ProseLink } from "@/site/prose-link"
import {
  failureModes,
  groupRules,
  RULES_LEDE,
  rulesRegistry,
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

const pad = (n: number) => String(n).padStart(2, "0")

/** The section head the design repeats: a display-s heading, a mono count on the right. */
function SectionHead({ title, count }: { title: string; count: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-quebi-display-s text-quebi-fg">{title}</h2>
      <span className="quebi-eyebrow">{count}</span>
    </div>
  )
}

export default function Rules() {
  const groups = groupRules()
  // Rules are numbered in nav order — group, then tier — so "rule 03" is the
  // third link in the sidebar as well as the third row here.
  const numbered = groups.flatMap(({ rules }) => rules)
  const numberOf = (id: string) => pad(numbered.findIndex((r) => r.id === id) + 1)

  return (
    <div>
      <p className="quebi-eyebrow">guidelines — {rulesRegistry.length} rules</p>
      <h1 className="mt-3 font-display text-quebi-display-l text-quebi-fg">rules</h1>
      <p className="mt-5 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        {rulesRegistry.length} rule{rulesRegistry.length === 1 ? "" : "s"} for building an app with
        ui-lib components. Each one names what to import instead of what it forbids, shows a real
        wrong/right pair, and ships a check you can run in your own project. Agents can read the
        same rules as JSON from <Code>/api/rules.json</Code>.
      </p>

      <section className="mt-quebi-10">
        <SectionHead title="why these exist" count={`${pad(failureModes.length)} failure modes`} />
        <p className="max-w-[60ch] text-quebi-body text-quebi-fg-muted">{RULES_LEDE}</p>
        {/* The design's ruled columns: a strong rule on top, hairlines between. */}
        <div className="mt-6 grid border-quebi-rule border-t sm:grid-cols-2">
          {failureModes.map((mode) => (
            <div
              key={mode.id}
              className="border-quebi-hairline border-b py-5 sm:odd:me-5 sm:odd:border-e sm:odd:pe-5"
            >
              <h3 className="font-display text-quebi-fg text-quebi-title">{mode.title}</h3>
              <p className="mt-2 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">{mode.body}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {mode.ruleIds.map((id) => (
                  <li key={id}>
                    <Link
                      to={`/rules/${id}`}
                      className="outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg"
                    >
                      <Badge className="transition-colors duration-150 hover:bg-quebi-pressed">
                        {rulesRegistry.find((r) => r.id === id)?.navTitle ?? id}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-quebi-9">
          <h3 className="font-display text-quebi-fg text-quebi-title">
            {whyLintNotInstructions.title}
          </h3>
          <DescriptionList className="mt-4">
            {whyLintNotInstructions.points.map((point) => (
              <div key={point.title} className="contents">
                <DescriptionTerm>{point.title}</DescriptionTerm>
                <DescriptionDetails>{point.body}</DescriptionDetails>
              </div>
            ))}
          </DescriptionList>
        </div>
      </section>

      {groups.map(({ group, rules }) => (
        <section key={group.id} className="mt-quebi-10">
          <SectionHead
            title={group.title.toLowerCase()}
            count={`${pad(rules.length)} rule${rules.length === 1 ? "" : "s"}`}
          />
          <p className="max-w-[60ch] font-display text-quebi-fg text-quebi-title">
            {group.principle}
          </p>
          <p className="mt-3 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
            {group.description}
          </p>
          <IndexLinkList
            className="mt-6"
            rows={rules.map((rule) => ({
              to: `/rules/${rule.id}`,
              number: numberOf(rule.id),
              title: rule.title,
              description: rule.summary,
              meta: [rule.tier ? `tier ${rule.tier}` : null, rule.severity, rule.enforcement.kind]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </section>
      ))}

      <section className="mt-quebi-10 border-quebi-rule border-t pt-6">
        <p className="quebi-eyebrow">enforcement</p>
        <h2 className="mt-3 font-display text-quebi-display-s text-quebi-fg">
          run these in your own project
        </h2>
        <p className="mt-3 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
          All {rulesRegistry.length} rules as one Biome config, with a GritQL plugin for each rule
          Biome has no built-in for and the documented exceptions already applied.
        </p>
        <ProseLink to="/rules/enforcement" className="mt-5 inline-block font-display text-quebi-link">
          set it up →
        </ProseLink>
      </section>
    </div>
  )
}
