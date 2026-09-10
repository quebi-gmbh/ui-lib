/**
 * The rules half of the generated API.
 *
 * The records in `src/registry/rules` are the only place a rule is written down;
 * the /rules route, the JSON endpoints emitted here, llms.txt and SKILL.md all
 * render from them. The validation in `emitRules` is the point of that: a rule
 * that names a component which no longer exists, or an exception with no
 * justification, fails the build instead of quietly becoming a lie.
 */
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import {
  failureModes,
  getRuleGroup,
  RULES_LEDE,
  ruleGroups,
  rulesRegistry,
  whyLintNotInstructions,
} from "../../src/registry/rules"
import {
  buildRuleChecks,
  pluginRules,
  renderBiomeConfig,
  renderBiomeSetup,
  renderGritPlugin,
} from "../../src/registry/rules/checks"
import type { RuleCheck } from "../../src/registry/rules/types"
import { API, BASE_URL, type Highlight, RULE_PLUGINS_OUT, RULES_OUT, SRC_DIR } from "./context"

/**
 * Validate every record, then emit `api/rules/<id>.json`, `api/rules.json`, the
 * published Biome config and its GritQL plugins, and the module that bakes each
 * rule page's highlighted snippets into the prerendered HTML.
 *
 * `allSlugs` and `racPrimitives` both come from the component pass: a rule may
 * only point at a component that exists, and the primitives a rule forbids are
 * exactly the ones the library wraps.
 */
export async function emitRules(
  highlight: Highlight,
  allSlugs: Set<string>,
  racPrimitives: string[],
): Promise<{ rulesCatalog: unknown[] }> {
  const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const RESERVED_RULE_SEGMENTS = new Set(["enforcement"])
  const groupIds = new Set(ruleGroups.map((g) => g.id))
  const seenRuleIds = new Set<string>()
  const ruleHighlights: { id: string; examples: { wrong: string; right: string }[] }[] = []
  const ruleCheckEntries: { id: string; checks: (RuleCheck & { highlighted: string })[] }[] = []
  const rulesCatalog: unknown[] = []

  for (const rule of rulesRegistry) {
    if (!KEBAB.test(rule.id)) {
      throw new Error(`Rule id "${rule.id}" must be kebab-case (it is also the /rules/<id> slug)`)
    }
    if (seenRuleIds.has(rule.id)) throw new Error(`Duplicate rule id "${rule.id}"`)
    // /rules/<id> shares its segment with the static pages under /rules. React
    // Router ranks a static route above a dynamic one, so a rule with a
    // colliding id would resolve to that page instead of to itself — a 200 with
    // the wrong content, which no test of the rules would catch.
    if (RESERVED_RULE_SEGMENTS.has(rule.id)) {
      throw new Error(
        `Rule id "${rule.id}" collides with the /rules/${rule.id} page and would be unreachable`,
      )
    }
    seenRuleIds.add(rule.id)

    if (!groupIds.has(rule.category)) {
      throw new Error(`Rule "${rule.id}" is in unknown group "${rule.category}"`)
    }
    for (const replacement of rule.replacements ?? []) {
      for (const target of replacement.use) {
        if (target.slug && !allSlugs.has(target.slug)) {
          throw new Error(
            `Rule "${rule.id}" tells you to replace <${replacement.element}> with "${target.slug}", which is not in the component registry`,
          )
        }
      }
    }
    for (const exception of rule.exceptions) {
      if (!exception.reason.trim()) {
        throw new Error(`Rule "${rule.id}" has an exception without a justification (${exception.scope})`)
      }
    }
    if (!rule.failureMode?.trim()) {
      throw new Error(
        `Rule "${rule.id}" does not say which behaviour it catches — a rule nobody can argue with is a rule nobody will keep`,
      )
    }
    if (rule.examples.length === 0) {
      throw new Error(`Rule "${rule.id}" has no wrong/right example`)
    }
    if (rule.enforcement.kind === "lint") {
      // A lint rule that cannot be generated into a check is just prose with a
      // severity on it, and a message that does not name the replacement makes
      // the reader go hunting — both are the failure this whole route exists to
      // prevent, so they fail the build.
      if (!rule.enforcement.biome) {
        throw new Error(
          `Rule "${rule.id}" is enforced by lint but says nothing about how Biome carries it`,
        )
      }
      if (!rule.enforcement.message) {
        throw new Error(
          `Rule "${rule.id}" is enforced by lint but has no message — it must say what to use instead`,
        )
      }
    }

    ruleHighlights.push({
      id: rule.id,
      examples: rule.examples.map((e) => ({ wrong: highlight(e.wrong), right: highlight(e.right) })),
    })

    // Runnable checks, derived from the record — never hand-written, so the rule
    // a human reads and the config a machine runs come from the same source.
    const checks = buildRuleChecks(rule, BASE_URL, racPrimitives)
    ruleCheckEntries.push({
      id: rule.id,
      checks: checks.map((c) => ({ ...c, highlighted: highlight(c.code, c.language) })),
    })

    const ruleJson = {
      ...rule,
      group: getRuleGroup(rule.category),
      checks,
      page: `${BASE_URL}/rules/${rule.id}`,
    }
    await writeFile(join(RULES_OUT, `${rule.id}.json`), JSON.stringify(ruleJson, null, 2))
    rulesCatalog.push(ruleJson)
  }

  // The whole lint setup, generated from the same records: one Biome config plus
  // a GritQL plugin per rule Biome has no built-in for. This repo has no lint
  // setup of its own to wire them into; they are published as artifacts a
  // consuming app drops in, which is the point of keeping `biome` and `message`
  // on the record in the first place.
  const biomeConfig = renderBiomeConfig(rulesRegistry, BASE_URL, racPrimitives)
  await writeFile(join(RULES_OUT, "biome.jsonc"), biomeConfig)
  for (const rule of pluginRules(rulesRegistry)) {
    await writeFile(join(RULE_PLUGINS_OUT, `${rule.id}.grit`), renderGritPlugin(rule, BASE_URL))
  }

  const biomeSetup = renderBiomeSetup(rulesRegistry, BASE_URL)

  // Every failure mode has to name rules that exist, and every rule has to be
  // claimed by one: a rule nothing motivates is a rule nobody will defend.
  const claimed = new Set(failureModes.flatMap((m) => m.ruleIds))
  for (const mode of failureModes) {
    for (const id of mode.ruleIds) {
      if (!seenRuleIds.has(id)) {
        throw new Error(`Failure mode "${mode.id}" points at unknown rule "${id}"`)
      }
    }
  }
  for (const rule of rulesRegistry) {
    if (!claimed.has(rule.id)) {
      throw new Error(`Rule "${rule.id}" is not claimed by any failure mode in why.ts`)
    }
  }

  // rules.json — every rule in one fetch, mirroring api/index.json.
  await writeFile(
    join(API, "rules.json"),
    JSON.stringify(
      {
        name: "ui-lib rules",
        description:
          "How to use quebi ui-lib correctly in a consuming app: when a raw HTML element is allowed, and which component to import when it is not.",
        baseUrl: BASE_URL,
        count: rulesCatalog.length,
        groups: ruleGroups,
        why: { lede: RULES_LEDE, failureModes, insteadOfInstructions: whyLintNotInstructions },
        rules: rulesCatalog,
        enforcement: {
          description:
            "Every rule carries runnable checks in its `checks` array, generated from the same record. Biome carries them: a built-in rule where one fits, a GritQL plugin otherwise.",
          biomeConfig: `${BASE_URL}/api/rules/biome.jsonc`,
          plugins: pluginRules(rulesRegistry).map(
            (r) => `${BASE_URL}/api/rules/plugins/${r.id}.grit`,
          ),
        },
      },
      null,
      2,
    ),
  )

  // Generated module: rule id -> Shiki HTML for each wrong/right pair, so the
  // /rules pages prerender highlighted code without shipping a highlighter.
  const ruleHighlightModule = [
    "// AUTO-GENERATED by scripts/generate-api.ts. Do not edit.",
    'import type { RuleCheck } from "./types"',
    "",
    "export interface RuleExampleHighlight {",
    "  wrong: string",
    "  right: string",
    "}",
    "",
    "/** A generated check plus its build-time Shiki HTML. */",
    "export type RuleCheckWithHighlight = RuleCheck & { highlighted: string }",
    "",
    "export const ruleExampleHighlights: Record<string, RuleExampleHighlight[]> = {",
    ...ruleHighlights.map((r) => `  ${JSON.stringify(r.id)}: ${JSON.stringify(r.examples)},`),
    "}",
    "",
    "export const ruleChecks: Record<string, RuleCheckWithHighlight[]> = {",
    ...ruleCheckEntries.map((r) => `  ${JSON.stringify(r.id)}: ${JSON.stringify(r.checks)},`),
    "}",
    "",
    "/** Every rule as one Biome config, for the /rules index. */",
    `export const biomeConfigSource = ${JSON.stringify(biomeConfig)}`,
    `export const biomeConfigHighlighted = ${JSON.stringify(highlight(biomeConfig, "json"))}`,
    "",
    "/** The steps that make the config above runnable in a project. */",
    `export const biomeSetupSource = ${JSON.stringify(biomeSetup)}`,
    `export const biomeSetupHighlighted = ${JSON.stringify(highlight(biomeSetup, "bash"))}`,
    "",
  ].join("\n")
  await writeFile(join(SRC_DIR, "registry/rules/highlighted.generated.ts"), ruleHighlightModule)

  return { rulesCatalog }
}

/**
 * The rules, rendered for llms.txt. Same records as the /rules route, so the
 * prose an agent reads and the page a human reads cannot disagree.
 */
export function rulesLlmsSection(): string[] {
  return [
    "## Rules for writing code against this library",
    "",
    RULES_LEDE,
    "",
    ...failureModes.flatMap((mode) => [`- **${mode.title}.** ${mode.body}`]),
    "",
    `These are lint rules rather than instructions on purpose. ${whyLintNotInstructions.points
      .map((p) => p.title)
      .join("; ")}. Every message names the replacement, so the correction arrives with the error.`,
    "",
    ...ruleGroups.flatMap((group) => {
      const groupRules = rulesRegistry.filter((r) => r.category === group.id)
      if (groupRules.length === 0) return []
      return [
        `### ${group.title} — ${group.principle}`,
        "",
        group.description,
        "",
        ...groupRules.map(
          (r) =>
            `- **[${r.title}](${BASE_URL}/rules/${r.id})** (\`${r.id}\`, ${r.severity}${r.tier ? `, tier ${r.tier}` : ""}): ${r.summary}`,
        ),
        "",
      ]
    }),
    `Each rule carries its rationale, a real wrong/right pair from this repo's own source, its documented exceptions, and a \`checks\` array of runnable snippets: \`GET ${BASE_URL}/api/rules.json\`.`,
    "",
    `The same setup, written for humans: [${BASE_URL}/rules/enforcement](${BASE_URL}/rules/enforcement).`,
    "",
    "To check a codebase against these rules rather than reason about them:",
    "",
    "```sh",
    `curl -O ${BASE_URL}/api/rules/biome.jsonc   # every rule, exceptions included`,
    "```",
    "",
    "Biome parses TSX natively, so there is nothing else to configure. Rules Biome has no built-in for ship as GritQL plugins listed in that config's `plugins` key; fetch each one next to it. With no linter available at all, each rule's `checks` array also carries a ripgrep command that needs nothing installed.",
    "",
  ]
}

/** The same rules, condensed for the Claude skill. */
export function rulesSkillSection(): string {
  return ruleGroups
    .flatMap((group) => {
      const groupRules = rulesRegistry.filter((r) => r.category === group.id)
      if (groupRules.length === 0) return []
      return [
        `**${group.principle}**`,
        "",
        ...groupRules.map(
          (r) => `- ${r.tier ? `Tier ${r.tier} — ` : ""}**${r.title}.** ${r.summary}`,
        ),
        "",
      ]
    })
    .join("\n")
}
