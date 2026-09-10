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
  restrictedElements,
  severityOf,
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
  /**
   * For the element ban only: relax it for these intrinsics and leave the rest
   * of the list standing. Same knob a published exception has (`elements` on a
   * `RuleException`), and for the same reason — "a <form> is allowed here" and
   * "raw HTML is allowed here" are different concessions, and a table that can
   * only express the second turns every narrow argument into a broad one.
   * Omitted means the whole rule is off for those paths.
   */
  elements?: string[]
  reason: string
}

/**
 * The kinds of code in `src/`, and how much of the rule set each gets.
 *
 * `src/routes/**` and `src/site/**` are missing from this table on purpose: the
 * gallery is a real React Router app built out of these components, so it gets
 * every rule at full strength and is the standing proof that the rules are
 * livable. `src/site/**` exists so that the app's chrome — header, footer,
 * sidebars, theme toggle, code block — is filed as app code rather than sitting
 * in `src/components/` and inheriting the library-source carve-out, which is an
 * argument about a layer and not about an address.
 *
 * Nothing in this table relaxes a rule from Biome's recommended set, and that is
 * deliberate. `src/registry/*.examples.tsx` is the case worth stating: an example
 * is copied verbatim into a consumer's app through `/api/components/<slug>.json`,
 * so a `noArrayIndexKey` in a demo list is copied along with it. Exempting the
 * examples would put the one kind of file we hand to other people outside the
 * checks we tell them to run.
 *
 * `tests/**\/*.tsx` is the other case, and it is deliberately three narrow
 * entries rather than one "tests are different" line: a rendering fixture is app
 * code that happens to assert instead of ship, so what it genuinely cannot do is
 * named one item at a time — the <form> element alone out of the tier-1 list,
 * the server-validation rule for fixtures that have no route action, and one
 * rule in one file that renders a banned shape on purpose — and everything else
 * is left switched on. What that buys is the property the whole file list is
 * for: a raw `<button>`, a `toLocaleString()` or a `confirm()` in a fixture is
 * reported there exactly as it would be in `src/routes/`.
 *
 * `src/lib/*.ts` is the one entry that is not about a kind of code but about
 * how a file leaves this repo: a `@/lib/*` module is published as its own
 * `registry:lib` item with no registry dependencies, so it cannot be split
 * without landing a dangling import in someone else's project. Only the length
 * rule is relaxed, and only there.
 */
export const localScopes: LocalScope[] = [
  {
    includes: ["src/registry/*.examples.tsx"],
    rules: ["no-appearance-classes-on-layout-elements", "no-hardcoded-design-values"],
    reason:
      "An example shows one component in isolation, so it has to hand-build the scaffolding around it — the fixed-height box a ScrollArea scrolls inside, the bordered chip a ColorThumb sits on, the status colours a Tracker renders as data. None of that is an app reimplementing a Card, which is what these two rules are about; and the tier-2 check is a class-string match, so it also fires on a ui-lib component's own className prop. Tier 1 and tier 4 stay on here — an example is copied verbatim, so a raw <button> in one propagates into every app that copies it.",
  },
  {
    includes: ["src/lib/*.ts"],
    rules: ["keep-files-readable"],
    reason:
      "A shared lib module cannot be split, and not as a matter of taste: generate-api.ts emits each @/lib/* module a component imports as its own registry:lib item with registryDependencies hardcoded to [], so a second module imported by the first would land in a consumer's project as a dangling import. src/lib/data-table.ts is the headless core both tables share — column vocabulary, sorting seam, selection model, query contract — and the rule's question, 'can this be split into files that stand alone', has an answer here that is no for a reason outside the file. The library-source exception the record already carries makes the same argument about src/components/**; this is the same layer, filed at a different address. Everything else about these files is linted, including Biome's recommended set.",
  },
  {
    includes: ["tests/**/*.tsx"],
    rules: ["no-raw-interactive-elements"],
    elements: ["form"],
    reason:
      "The <form> element, and nothing else on the tier-1 list. This is the rule's own published exception — a <form> that submits on the client only, with no route action behind it — arriving at the place in this repo where it is unavoidable: a Conform fixture asserts what getFormProps(form) and form.onSubmit put in the DOM, and react-router's <Form> would need a router mounted around every test to prove nothing about the binding. Naming the one element is the whole point of the entry. The fixtures' buttons are ui-lib's Button (they were raw <button>s until this scope was written, and converting them changed no assertion), so a raw <button>, <input>, <select> or <table> in a test is reported here exactly as it is in src/routes.",
  },
  {
    includes: ["tests/**/*.tsx"],
    rules: ["validate-on-the-server-with-the-same-schema"],
    reason:
      "A fixture has no server to validate on. The rule reads a useForm call with no `lastResult` as \"nothing on the server parses this schema\", which is the right reading of an app and a false one of a test: the value it asks for is what a route action returned, and a test that mounts a component has no route. Quieting it by passing a hand-built lastResult would be the worse outcome — the fixture would then assert a server round-trip it never made. Its companion, gate-last-result-on-idle-navigation, needs no entry and does not get one: that rule fires on a lastResult that is present and ungated, so a fixture without one never reaches it, and a fixture that grows one still has to gate it.",
  },
  {
    includes: ["tests/conform-binding.test.tsx"],
    rules: ["seed-toggles-with-default-selected"],
    reason:
      "One file, one rule, because that file renders the banned shape on purpose: <Switch {...getInputProps(field, { type: \"checkbox\" })}> is the spread this rule exists to stop, and the two tests around it measure what it costs — the switch renders off, and nothing in the DOM records the loss. A rule firing on its own counter-example is the rule working, and there is nowhere to say so in the file: Biome has no suppression comment for a GritQL plugin diagnostic, which is why this is a table entry rather than a biome-ignore. Scoped to the one path so that a real spread in any other fixture is still reported.",
  },
]

/**
 * Files this repo lints: its own TypeScript, all of it.
 *
 * This list used to be the rules' `appliesTo` and nothing else — `src/**\/*.tsx`
 * — which quietly meant that every `.ts` file in the repo went unchecked:
 * `scripts/`, `tests/`, the rule records themselves, `src/lib/`. That was not the
 * rules' doing. It was a plugin-loading detail leaking into the file list: Biome
 * loads GritQL plugins globally, so before each plugin carried its record's
 * `appliesTo` as a `$filename` guard, the only way to keep a JSX rule from
 * answering questions about a `.ts` file was to keep the `.ts` file out of the
 * run. `renderGritPlugin` compiles that guard now, so the file list is free to be
 * what it should have been: the code in this repo.
 *
 * Which matters because most of what runs here is Biome's recommended set, and
 * a `noAssignInExpressions` in a generator is the same defect as one in a
 * component. The generator that emits this very config was one of the files
 * outside the run.
 *
 * `src/components/**` used to be a subtraction too: the library primitives carry
 * `biome-ignore lint/a11y/...` comments for a consumer's fuller Biome setup, and
 * a rules-only config reported every one of them as an unused suppression, so
 * the choice was seventeen lines of noise on every run or no linting there at
 * all. With Biome's recommended set on those suppressions land on rules that
 * actually run, and the directory is linted like everything else — the records
 * already except it from six of the eight ui-lib rules, and the seventh, the
 * tier-1 element ban minus <input>, is the guarantee that had to live in
 * tests/repo-lint.test.ts until now.
 *
 * Note what that leaves standing: the carve-out is now the records' business
 * alone, and it reaches only files that are actually the library. Every file in
 * `src/components/` has a `slug` in src/registry/meta.ts — a test fails if one
 * does not — so nothing can be excused by its address any more.
 *
 * `tests/**\/*.tsx` was the last hole, and it was left open on purpose rather
 * than by oversight: every diagnostic it reported was *plausibly* a legitimate
 * fixture — a Conform test needs a real <form>, a test about react-aria's id
 * ownership has to name react-aria — and the previous stance ("tests/ is outside
 * the file list, say why in a comment") meant a genuine mistake in a fixture
 * looked exactly like a deliberate one. Reading them one at a time settled it:
 * the raw <button>s were shortcuts and are ui-lib's Button now, a class
 * assertion naming `bg-red-500/10` is a token assertion now, and what is left is
 * three narrow entries in `localScopes` plus one `biome-ignore` whose reason
 * says what forces it. The fixtures are code this repo ships nothing of and
 * relies on entirely; they get the same reading as everything else.
 *
 * CSS stays out, and that is still a gap rather than a decision: Biome cannot
 * parse Tailwind v4's at-rules, and the `no-hardcoded-design-values` record
 * documents CSS as outside what its check can see.
 */
function fileIncludes(): string[] {
  return [
    "src/**/*.tsx",
    "src/**/*.jsx",
    "src/**/*.ts",
    "scripts/**/*.ts",
    "tests/**/*.ts",
    "tests/**/*.tsx",
    // The build's own configuration — react-router.config.ts, vite.config.ts.
    // A single `*` does not cross a directory separator, so this is the repo
    // root and nowhere else.
    "*.ts",
  ]
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

/** What an override entry may say about a built-in rule: off, or on with fewer elements. */
type BuiltInOverride = "off" | { level: "error" | "warn"; options: { elements: Record<string, string> } }

/**
 * The override value for one rule in one local scope.
 *
 * `"off"` unless the scope narrowed itself to particular elements, in which case
 * the rule stays on with those removed from its map — and the map, messages and
 * severity all still come from the record, so a new replacement in the record
 * shows up inside the carve-out too.
 */
function elementScopedOverride(ruleId: string, elements: string[] | undefined): BuiltInOverride {
  if (!elements?.length) return "off"
  const rule = rulesRegistry.find((r) => r.id === ruleId)
  if (!rule) throw new Error(`Local scope names "${ruleId}", which is not a rule in the registry`)
  const all = restrictedElements(rule)
  for (const element of elements) {
    if (!(element in all)) {
      throw new Error(
        `Local scope excuses <${element}> from "${ruleId}", which does not restrict that element`,
      )
    }
  }
  const remaining = Object.fromEntries(
    Object.entries(all).filter(([element]) => !elements.includes(element)),
  )
  // Excusing every element it restricts is the same thing as switching it off,
  // said less clearly — so say it the clear way.
  return Object.keys(remaining).length
    ? { level: severityOf(rule), options: { elements: remaining } }
    : "off"
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
    const rules: Record<string, Record<string, BuiltInOverride>> = {}
    for (const ruleId of scope.rules) {
      const key = biomeRuleKey(ruleId)
      if (!key) continue
      rules[key.group] ??= {}
      // A scope naming `elements` leaves the rule on and removes just those,
      // the same way a record's own exception does — so "a fixture may render
      // <form>" does not also license a hand-rolled <button> beside it.
      rules[key.group][key.name] = elementScopedOverride(ruleId, scope.elements)
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

  // Only inside `overrides`. The same glob can appear in `files.includes` too —
  // `tests/**\/*.tsx` does — and "this rule is relaxed here" written above a
  // file-list entry reads as if the file list were what relaxed it. It is not:
  // the file list says which files are linted, the override says with what.
  let inOverrides = false

  return json
    .split("\n")
    .map((line) => {
      const indent = line.match(/^\s*/)?.[0] ?? ""
      if (/^\s*"overrides":/.test(line)) inOverrides = true
      const plugin = plugins.find((rule) => line.includes(`/${rule.id}.grit`))
      if (plugin) return `${indent}// ${plugin.title}\n${line}`
      const path = line.match(/^\s*"([^"]+)",?$/)?.[1]
      if (!inOverrides) return line
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
