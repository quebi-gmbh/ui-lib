import { CodeBlock } from "@/site/code-block"
import { ProseLink } from "@/site/prose-link"
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

/** The section head the design repeats: a display-s heading, a mono number on the right. */
function SectionHead({ title, count }: { title: string; count: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-quebi-display-s text-quebi-fg">{title}</h2>
      <span className="quebi-eyebrow">{count}</span>
    </div>
  )
}

export default function RulesEnforcement() {
  const plugins = pluginRules(rulesRegistry)
  const builtIns = builtInRules(rulesRegistry)

  return (
    <div>
      <p className="quebi-eyebrow">enforcement — biome</p>
      <h1 className="mt-3 font-display text-quebi-display-l text-quebi-fg">
        run the rules, don't just read them.
      </h1>
      <p className="mt-5 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        All {rulesRegistry.length} rules as one Biome setup, exceptions included. It is rebuilt from
        the rules whenever they change, so re-download it rather than maintaining a copy by hand —
        that way a rule we sharpen reaches your CI. Enforcing one rule at a time? Each rule's page
        carries its own snippet, plus a <Code>ripgrep</Code> one-liner for projects with no linter at
        all.
      </p>

      <Note intent="info" className="mt-quebi-8 max-w-quebi-content">
        Nothing to install from us beyond Biome itself, which parses TSX with no parser to configure.
        These keys are a fragment to merge: the config says nothing about Biome's{" "}
        <Code>recommended</Code> rules, so dropping it in cannot silently change what else your
        project lints. You own all of it once it lands — soften a rule to <Code>warn</Code>, scope it
        with <Code>overrides</Code>, or drop an entry you disagree with.
      </Note>

      <section className="mt-quebi-10">
        <SectionHead title="wire it up" count="01" />
        <div>
          <CodeBlock html={biomeSetupHighlighted} code={biomeSetupSource} />
        </div>
      </section>

      <section className="mt-quebi-10">
        <SectionHead title="how biome carries each rule" count="02" />
        <p className="max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
          Two mechanisms, and the difference decides how a rule's documented exceptions are applied.
        </p>
        <DescriptionList className="mt-5">
          <DescriptionTerm>Built-in rules</DescriptionTerm>
          <DescriptionDetails>
            {builtIns.map((rule) => (
              <div key={rule.id}>
                <ProseLink to={`/rules/${rule.id}`}>
                  {rule.navTitle ?? rule.title}
                </ProseLink>{" "}
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
                  <ProseLink to={`/rules/${rule.id}`}>
                    {rule.navTitle ?? rule.title}
                  </ProseLink>{" "}
                  <UiLink
                    href={`/api/rules/plugins/${rule.id}.grit`}
                    className="font-mono text-quebi-caption"
                  >
                    {rule.id}.grit
                  </UiLink>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-quebi-fg-muted">
              Each plugin is loaded by an <Code>overrides</Code> entry of its own, whose{" "}
              <Code>includes</Code> are the paths the rule applies to followed by its exceptions as{" "}
              <Code>!</Code> entries — the same mechanism the built-ins use, from the same records.
              Load one from the top-level <Code>plugins</Code> instead and it runs against every
              file you lint: an override adds a plugin to the files it matches and cannot take one
              away.
            </p>
          </DescriptionDetails>
        </DescriptionList>
      </section>

      <section className="mt-quebi-10">
        <SectionHead title={`biome.jsonc — all ${rulesRegistry.length} rules`} count="03" />
        <UiLink href="/api/rules/biome.jsonc" className="font-mono text-quebi-code">
          /api/rules/biome.jsonc
        </UiLink>
        <div className="mt-5">
          <CodeBlock html={biomeConfigHighlighted} code={biomeConfigSource} />
        </div>
      </section>

      <section className="mt-quebi-10 border-quebi-rule border-t pt-6">
        <p className="quebi-eyebrow">{rulesRegistry.length} rules</p>
        <p className="mt-3 max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
          Every rule names what to import instead of what it forbids, shows a real wrong/right
          pair, and lists the exceptions this config applies.
        </p>
        <ProseLink to="/rules" className="mt-5 inline-block font-display text-quebi-link">
          back to the rules →
        </ProseLink>
      </section>
    </div>
  )
}
