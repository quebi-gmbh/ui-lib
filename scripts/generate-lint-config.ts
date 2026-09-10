/**
 * Generates this repo's own lint setup from the rule records in
 * `src/registry/rules/` — `biome.jsonc` at the root and one `ui-lib-rules/*.grit`
 * plugin per rule Biome has no built-in for.
 *
 *     bun run generate:lint
 *
 * Nothing here is hand-written per rule. Editing a record and re-running this
 * changes the config; `tests/repo-lint.test.ts` fails if the committed files and
 * the records disagree, so the two cannot drift.
 *
 * ## Why a second config at all
 *
 * `public/api/rules/biome.jsonc` is the fragment consumers download: a project
 * merges it into its own Biome setup. This one is a *complete* config for this
 * repo, which means it also has to answer questions the published fragment
 * deliberately leaves open — which paths to lint, and what to do about Biome's
 * own rules (run them: see `preset` below).
 *
 * The rules themselves are identical. What differs is scope, and the scope
 * decisions are the table below rather than edits to the published records:
 * ui-lib's directory layout is ui-lib's business, and a rule record that names
 * `src/registry/*.examples.tsx` would be publishing our filing system as if it
 * were guidance.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  type ExtraPluginIgnore,
  buildBiomeConfig,
  deriveRacPrimitives,
  firstSentence,
  pluginRules,
  renderGritPlugin,
} from "../src/registry/rules/checks"
import { rulesRegistry } from "../src/registry/rules"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const PLUGIN_DIR = "ui-lib-rules"
const CONFIG_FILE = "biome.jsonc"

/**
 * A rule switched off for part of *this* repo, and the argument for it.
 *
 * This is the same shape as a rule's published `exceptions`, kept separate
 * because it is about ui-lib's own tree rather than about the rule. Every entry
 * names the rules it relaxes — a blanket "off for this directory" is what this
 * table exists to avoid, because it hides which guarantee was given up.
 */
export interface LocalScope {
  /** Globs, relative to the repo root. */
  includes: string[]
  /** Rule ids relaxed for those paths. */
  rules: string[]
  reason: string
}

/**
 * The three kinds of code in `src/`, and how much of the rule set each gets.
 *
 * `src/routes/**` is missing from this table on purpose: the gallery is a real
 * React Router app built out of these components, so it gets every rule at full
 * strength and is the standing proof that the rules are livable.
 *
 * Nothing in this table relaxes a rule from Biome's recommended set, and that is
 * deliberate. `src/registry/*.examples.tsx` is the case worth stating: an example
 * is copied verbatim into a consumer's app through `/api/components/<slug>.json`,
 * so a `noArrayIndexKey` in a demo list is copied along with it. Exempting the
 * examples would put the one kind of file we hand to other people outside the
 * checks we tell them to run.
 */
export const localScopes: LocalScope[] = [
  {
    includes: ["src/registry/*.examples.tsx"],
    rules: ["no-appearance-classes-on-layout-elements", "no-hardcoded-design-values"],
    reason:
      "An example shows one component in isolation, so it has to hand-build the scaffolding around it — the fixed-height box a ScrollArea scrolls inside, the bordered chip a ColorThumb sits on, the status colours a Tracker renders as data. None of that is an app reimplementing a Card, which is what these two rules are about; and the tier-2 check is a class-string match, so it also fires on a ui-lib component's own className prop. Tier 1 and tier 4 stay on here — an example is copied verbatim, so a raw <button> in one propagates into every app that copies it.",
  },
]

/**
 * Files this repo lints, derived from the rules' own `appliesTo` globs.
 *
 * Every rule declares `src/**\/*.{tsx,jsx}`, so that is the whole list — no
 * subtractions. `src/components/**` used to be one: the library primitives carry
 * `biome-ignore lint/a11y/...` comments for a consumer's fuller Biome setup, and
 * a rules-only config reported every one of them as an unused suppression, so
 * the choice was seventeen lines of noise on every run or no linting there at
 * all. With Biome's recommended set on those suppressions land on rules that
 * actually run, and the directory is linted like everything else — the records
 * already except it from six of the eight ui-lib rules, and the seventh, the
 * tier-1 element ban minus <input>, is the guarantee that had to live in
 * tests/repo-lint.test.ts until now.
 *
 * The `css` half of tier 3's `appliesTo` stays out: Biome cannot parse Tailwind
 * v4's at-rules, and that rule already documents CSS as outside what its check
 * can see.
 */
function fileIncludes(): string[] {
  return ["src/**/*.tsx", "src/**/*.jsx"]
}

/** The Biome rule ids a rule record maps to, for the local-scope overrides. */
function biomeRuleKey(ruleId: string): { group: string; name: string } | null {
  const rule = rulesRegistry.find((r) => r.id === ruleId)
  if (!rule) throw new Error(`Local scope names "${ruleId}", which is not a rule in the registry`)
  const biome = rule.enforcement.biome
  if (biome?.via !== "rule") return null
  const [group, name] = biome.rule.split("/")
  return { group, name }
}

/** Repo-local guards for one plugin rule, pulled out of the scope table. */
export function localIgnoresFor(ruleId: string): ExtraPluginIgnore[] {
  return localScopes
    .filter((scope) => scope.rules.includes(ruleId))
    .flatMap((scope) => scope.includes.map((glob) => ({ glob, reason: scope.reason })))
}

export async function buildRepoConfig() {
  const componentsDir = join(ROOT, "src", "components")
  const primitives = deriveRacPrimitives(
    await Promise.all(
      (await readdir(componentsDir))
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => readFile(join(componentsDir, file), "utf8")),
    ),
  )

  const generated = buildBiomeConfig(rulesRegistry, `./${PLUGIN_DIR}`, primitives)

  // A local scope on a built-in rule becomes an ordinary override. On a plugin
  // rule it cannot: Biome's overrides do not scope plugins, so those guards are
  // compiled into the plugin by `localIgnoresFor` instead.
  const localOverrides = localScopes.flatMap((scope) => {
    const rules: Record<string, Record<string, "off">> = {}
    for (const ruleId of scope.rules) {
      const key = biomeRuleKey(ruleId)
      if (!key) continue
      rules[key.group] ??= {}
      rules[key.group][key.name] = "off"
    }
    return Object.keys(rules).length
      ? [{ includes: scope.includes, linter: { rules } }]
      : []
  })

  return {
    $schema: "./node_modules/@biomejs/biome/configuration_schema.json",
    // Picks up .gitignore, so generated modules (`*.generated.ts`), the emitted
    // `public/api/**` — which contains a Biome config of its own — and build
    // output are all out of the way without restating them here.
    vcs: { enabled: true, clientKind: "git" as const, useIgnoreFile: true },
    files: { includes: fileIncludes() },
    // This file is the rules and nothing else. Formatting and import sorting are
    // separate decisions nobody has made for this repo yet, and turning them on
    // by accident would rewrite every file.
    formatter: { enabled: false },
    assist: { enabled: false },
    plugins: generated.plugins,
    linter: {
      enabled: true,
      rules: {
        // Biome's recommended set, on top of the rules this repo publishes.
        // The two answer different questions — "does this repo follow its own
        // rules" and "is this ordinary React sound" — but they answer them about
        // the same files, and a consumer runs both. Running only ours here meant
        // src/components' `biome-ignore lint/a11y/...` comments, written for a
        // consumer's setup, suppressed rules nothing ran, which is why that
        // directory used to sit outside `files.includes` entirely.
        preset: "recommended" as const,
        ...generated.linter.rules,
      },
    },
    overrides: [...generated.overrides, ...localOverrides],
  }
}

/** The header explaining, in the file itself, that the file is not editable by hand. */
function header(): string {
  return [
    "// AUTO-GENERATED by scripts/generate-lint-config.ts from the rule records in",
    "// src/registry/rules/ — do not edit by hand. Run `bun run generate:lint`.",
    "//",
    "// This is ui-lib linting itself with the rules it publishes at",
    "// https://ui-lib.quebi.de/rules. The consumer-facing fragment is a different",
    "// artifact (public/api/rules/biome.jsonc); the rules in both are the same",
    "// records, only the scoping differs. See the script for the scope decisions.",
  ].join("\n")
}

/**
 * Comment every line of the rendered JSON that would otherwise be an unexplained
 * path: each plugin says which rule it carries, and each `includes` entry in an
 * override says which carve-out put it there and why. Annotations go on their own
 * line rather than trailing the value, so stripping `//` lines gets the JSON back
 * — which is how the sync test compares this file to the records.
 */
function annotate(json: string, config: Awaited<ReturnType<typeof buildRepoConfig>>): string {
  const plugins = pluginRules(rulesRegistry)
  const reasonsFor = (path: string): string[] => [
    ...rulesRegistry.flatMap((rule) =>
      rule.exceptions
        .filter((exception) => exception.paths?.includes(path))
        .map((exception) => `${rule.id} — ${firstSentence(exception.reason)}`),
    ),
    ...localScopes
      .filter((scope) => scope.includes.includes(path))
      .flatMap((scope) =>
        scope.rules.map((id) => `local scope, ${id} — ${firstSentence(scope.reason)}`),
      ),
  ]

  return json
    .split("\n")
    .map((line) => {
      const indent = line.match(/^\s*/)?.[0] ?? ""
      const plugin = plugins.find((rule) => line.includes(`/${rule.id}.grit`))
      if (plugin) return `${indent}// ${plugin.title}\n${line}`
      const path = line.match(/^\s*"([^"]+)",?$/)?.[1]
      if (!path || !config.overrides.some((o) => o.includes.includes(path))) return line
      return [...reasonsFor(path).map((reason) => `${indent}// ${reason}`), line].join("\n")
    })
    .join("\n")
}

export async function writeRepoConfig(root = ROOT) {
  const config = await buildRepoConfig()
  // JSONC so the file can explain itself in place. Every comment is on its own
  // line, so dropping the `//` lines leaves the JSON the records render — which
  // is what tests/repo-lint.test.ts compares.
  const body = annotate(JSON.stringify(config, null, 2), config)
  await writeFile(join(root, CONFIG_FILE), `${header()}\n${body}\n`)

  await mkdir(join(root, PLUGIN_DIR), { recursive: true })
  const written: string[] = []
  for (const rule of pluginRules(rulesRegistry)) {
    await writeFile(
      join(root, PLUGIN_DIR, `${rule.id}.grit`),
      renderGritPlugin(rule, undefined, localIgnoresFor(rule.id)),
    )
    written.push(`${PLUGIN_DIR}/${rule.id}.grit`)
  }
  return { config: CONFIG_FILE, plugins: written }
}

export { CONFIG_FILE, PLUGIN_DIR, ROOT }

if (import.meta.main) {
  const { config, plugins } = await writeRepoConfig()
  console.log(`Generated ${config} and ${plugins.length} plugin(s): ${plugins.join(", ")}`)
}
