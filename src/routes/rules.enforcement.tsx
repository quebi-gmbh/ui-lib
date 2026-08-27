import { Link } from "react-router"
import { FileCode } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card, CardDescription, CardTitle } from "@/components/card"
import { CodeBlock } from "@/components/code-block"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { Link as UiLink } from "@/components/link"
import { Note } from "@/components/note"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { builtInRules, pluginRules } from "@/registry/rules/checks"
import { rulesRegistry } from "@/registry/rules"
import {
  biomeConfigHighlighted,
  biomeConfigSource,
  biomeSetupHighlighted,
  biomeSetupSource,
} from "@/registry/rules/highlighted.generated"

export function meta() {
  return seo({
    title: "Enforcing the rules",
    description:
      "Run every quebi ui-lib rule in your own project with Biome: one config, a GritQL plugin per rule Biome has no built-in for, and the documented exceptions already applied.",
    path: "/rules/enforcement",
  })
}

export default function RulesEnforcement() {
  const plugins = pluginRules(rulesRegistry)
  const builtIns = builtInRules(rulesRegistry)

  return (
    <div>
      <span className="quebi-eyebrow">Enforcement</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">
        Run the rules, don't just read them
      </h1>
      <p className="mt-4 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
        All {rulesRegistry.length} rules as one Biome setup, exceptions included. It is rebuilt from
        the rules whenever they change, so re-download it rather than maintaining a copy by hand —
        that way a rule we sharpen reaches your CI. Enforcing one rule at a time? Each rule's page
        carries its own snippet, plus a <Code>ripgrep</Code> one-liner for projects with no linter at
        all.
      </p>

      <Note intent="info" className="mt-6">
        Nothing to install from us beyond Biome itself, which parses TSX with no parser to configure.
        These keys are a fragment to merge: the config says nothing about Biome's{" "}
        <Code>recommended</Code> rules, so dropping it in cannot silently change what else your
        project lints. You own all of it once it lands — soften a rule to <Code>warn</Code>, scope it
        with <Code>overrides</Code>, or drop an entry you disagree with.
      </Note>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">Wire it up</h2>
        <div className="mt-4">
          <CodeBlock html={biomeSetupHighlighted} code={biomeSetupSource} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-quebi-fg">How Biome carries each rule</h2>
        <p className="mt-1 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
          Two mechanisms, and the difference decides how a rule's documented exceptions are applied.
        </p>
        <DescriptionList className="mt-4">
          <DescriptionTerm>Built-in rules</DescriptionTerm>
          <DescriptionDetails>
            {builtIns.map((rule) => (
              <div key={rule.id}>
                <Link
                  to={`/rules/${rule.id}`}
                  className="font-medium text-quebi-brand transition-colors duration-200 hover:text-quebi-brand-hover"
                >
                  {rule.navTitle ?? rule.title}
                </Link>{" "}
                <span className="text-quebi-fg-subtle">
                  {rule.enforcement.biome?.via === "rule" ? rule.enforcement.biome.rule : ""}
                </span>
              </div>
            ))}
            <p className="mt-2 text-quebi-fg-muted">
              Configured in <Code>biome.jsonc</Code>, so their exceptions are ordinary{" "}
              <Code>overrides</Code> — Biome's own path scoping.
            </p>
          </DescriptionDetails>

          <DescriptionTerm>GritQL plugins</DescriptionTerm>
          <DescriptionDetails>
            <ul className="space-y-2">
              {plugins.map((rule) => (
                <li key={rule.id}>
                  <Link
                    to={`/rules/${rule.id}`}
                    className="font-medium text-quebi-brand transition-colors duration-200 hover:text-quebi-brand-hover"
                  >
                    {rule.navTitle ?? rule.title}
                  </Link>{" "}
                  <UiLink
                    href={`/api/rules/plugins/${rule.id}.grit`}
                    className="inline-flex items-center gap-1 text-xs"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    {rule.id}.grit
                  </UiLink>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-quebi-fg-muted">
              Biome loads plugins globally and <Code>overrides</Code> does not scope them, so each
              plugin carries its own exceptions as <Code>$filename</Code> guards compiled into the
              pattern. Same records, same carve-outs — a different mechanism because the tool
              requires one.
            </p>
          </DescriptionDetails>
        </DescriptionList>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-quebi-fg">
            biome.jsonc — all {rulesRegistry.length} rules
          </h2>
          <UiLink
            href="/api/rules/biome.jsonc"
            className="inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <FileCode className="h-4 w-4" />
            /api/rules/biome.jsonc
          </UiLink>
        </div>
        <div className="mt-4">
          <CodeBlock html={biomeConfigHighlighted} code={biomeConfigSource} />
        </div>
      </section>

      <section className="mt-12">
        <Link to="/rules" className="group block">
          <Card interactive>
            <div className="flex flex-wrap items-center gap-2">
              <Badge intent="brand">{rulesRegistry.length} rules</Badge>
            </div>
            <CardTitle className="mt-3">Back to the rules</CardTitle>
            <CardDescription className="mt-2">
              Every rule names what to import instead of what it forbids, shows a real wrong/right
              pair, and lists the exceptions this config applies.
            </CardDescription>
          </Card>
        </Link>
      </section>
    </div>
  )
}
