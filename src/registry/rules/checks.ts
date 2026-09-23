/**
 * Turning rule records into runnable Biome checks.
 *
 * This module is the only place that knows how a rule becomes a Biome rule, a
 * GritQL plugin, or a ripgrep command. `scripts/generate-api.ts` writes its
 * output into `public/api/rules/**`; the test suite feeds the same output to the
 * Biome CLI, so what is tested is what ships.
 *
 * Biome carries a rule one of two ways, and the difference used to decide how
 * the rule's scope was applied. It no longer does:
 *
 *  - a **built-in rule** (`correctness/noRestrictedElements`) is configured in
 *    `biome.jsonc`, so its exceptions are `overrides` entries — Biome's own
 *    path-scoping mechanism;
 *  - a **GritQL plugin** is listed on an `overrides` entry of its own, whose
 *    `includes` are the record's `appliesTo` followed by its exception paths as
 *    `!` entries. Same mechanism, same records.
 *
 * A plugin's scope was a `$filename` regex compiled into the pattern until task
 * #93, on the belief that `overrides` could not reach plugins. It can, since
 * Biome 2.5 — and the regex could never be right, because `$filename` is
 * absolute and a project-relative glob has no way to say where the project
 * starts. `./scope` carries that argument in full.
 *
 * Both halves come from the same `exceptions[].paths`. Nothing here is
 * hand-written per rule: a check that cannot be derived from a record is a check
 * that can drift away from the rule it claims to enforce.
 */
import {
  type ExtraPluginIgnore,
  exceptionPaths,
  firstSentence,
  grepGlob,
  scopeIncludes,
} from "./scope"
import type { RuleCheck, RuleMeta } from "./types"

// Path-scope translation lives in ./scope, and is re-exported here so that the
// generators and the tests keep one import for the whole of a rule's checks.
export type { ExtraPluginIgnore }
export { exceptionPaths, firstSentence, grepGlob, scopeIncludes }

const DEFAULT_BASE_URL = "https://ui-lib.quebi.de"

/** Biome severities. A rule's declared severity is used verbatim — no clamping. */
export function severityOf(rule: RuleMeta): "error" | "warn" {
  return rule.severity === "error" ? "error" : "warn"
}

/** Rules Biome checks, in registry order. */
export function lintRules(rules: RuleMeta[]): RuleMeta[] {
  return rules.filter((r) => r.enforcement.kind === "lint" && r.enforcement.biome)
}

export function builtInRules(rules: RuleMeta[]): RuleMeta[] {
  return lintRules(rules).filter((r) => r.enforcement.biome?.via === "rule")
}

export function pluginRules(rules: RuleMeta[]): RuleMeta[] {
  return lintRules(rules).filter((r) => r.enforcement.biome?.via === "plugin")
}

/**
 * GritQL delimits a regex with `r"..."`, so a bare `"` inside one ends it early
 * and the rest of the pattern becomes syntax garbage — which Biome reports only
 * as "Failed to compile the Grit plugin", with no location. Catching it here
 * turns a silent broken artifact into a build failure that names the rule.
 */
function assertRegexLiteralsClose(rule: RuleMeta, pattern: string): void {
  for (let i = pattern.indexOf('r"'); i !== -1; i = pattern.indexOf('r"', i + 1)) {
    let j = i + 2
    while (j < pattern.length && !(pattern[j] === '"' && pattern[j - 1] !== "\\")) j++
    // End of the pattern is legitimate: the last clause often *is* the regex.
    const next = pattern[j + 1] ?? ""
    if (next !== "" && !/[\s,)}]/.test(next)) {
      throw new Error(
        `Rule "${rule.id}": the GritQL regex starting at "${pattern.slice(i, i + 24)}..." closes at an unescaped quote and is followed by ${JSON.stringify(next)}. Escape the quote as \\" or drop it — GritQL ends a regex at the first bare ".`,
      )
    }
  }
}

/**
 * GritQL does not read `\"` inside a double-quoted string the way JSON writes
 * it: the escape is consumed and the rest of the literal is re-interpreted, so
 * every later `\t`-looking pair becomes a tab and the diagnostic arrives as
 * mojibake — with the rule's URL destroyed along with the text, which is what
 * the harness uses to attribute a finding to its rule. Biome reports it as an
 * ordinary plugin diagnostic, so nothing fails; the message just stops being
 * readable. A plugin message therefore quotes with 'single quotes'.
 */
function assertMessageHasNoDoubleQuotes(rule: RuleMeta, message: string): void {
  if (message.includes('"')) {
    throw new Error(
      `Rule "${rule.id}": its Biome message contains a double quote, which GritQL mangles once it is escaped into the plugin file (the text and the rule URL both come out garbled). Use 'single quotes' in the message — the record's prose can keep the real ones.`,
    )
  }
}

/**
 * The `overrides` entry that scopes one plugin, rendered for the file's header.
 *
 * The plugin file carries no scope of its own, so it carries the two lines of
 * config that give it one — the reader of a downloaded `.grit` should not have
 * to go and find out that listing it in the top-level `plugins` runs it over
 * every file in their project.
 */
function scopeSnippet(rule: RuleMeta, pluginDir: string): string[] {
  const entry = {
    includes: scopeIncludes(rule),
    plugins: [`${pluginDir}/${rule.id}.grit`],
  }
  return JSON.stringify({ overrides: [entry] }, null, 2).split("\n")
}

/** The plugin file for one rule: the pattern and its diagnostic. Scope is config. */
export function renderGritPlugin(rule: RuleMeta, baseUrl = DEFAULT_BASE_URL): string {
  const enforcement = rule.enforcement.biome
  if (enforcement?.via !== "plugin") {
    throw new Error(`Rule "${rule.id}" is not carried by a GritQL plugin`)
  }
  assertRegexLiteralsClose(rule, enforcement.pattern)
  assertMessageHasNoDoubleQuotes(rule, rule.enforcement.message ?? rule.summary)
  // The pattern ends with its last `where` clause; the diagnostic is a further
  // clause, so it is joined with a comma rather than glued on.
  const clauses = [
    enforcement.pattern,
    [
      "  register_diagnostic(",
      `    span = $${patternBinding(enforcement.pattern)},`,
      `    message = ${JSON.stringify(rule.enforcement.message ?? rule.summary)},`,
      `    severity = ${JSON.stringify(severityOf(rule))}`,
      "  )",
    ].join("\n"),
  ]

  return [
    `// ${rule.title}`,
    `// AUTO-GENERATED from ${baseUrl}/api/rules/${rule.id}.json — do not edit by hand.`,
    "//",
    `// ${baseUrl}/rules/${rule.id}`,
    "//",
    "// This file says what the rule is, not where it applies. A plugin listed in",
    "// the top-level `plugins` runs against every file Biome lints, so scope it",
    "// with an `overrides` entry — Biome resolves `includes` against the project",
    "// root, which is the one thing a $filename regex in here could not do:",
    "//",
    ...scopeSnippet(rule, PLUGIN_DIR).map((line) => `//   ${line}`),
    "",
    "language js;",
    "",
    `${clauses.join(",\n")}\n}`,
    "",
  ].join("\n")
}

/**
 * The variable a pattern binds with `as`, which is what the diagnostic spans.
 * Every plugin pattern ends its head with `as $name`, so this is a parse, not a
 * guess — and an unbound pattern fails the build rather than reporting on the
 * wrong node.
 */
function patternBinding(pattern: string): string {
  const match = pattern.match(/\bas\s+\$([A-Za-z_][A-Za-z0-9_]*)\s*where\b/)
  if (!match) {
    throw new Error(
      "A GritQL pattern must bind its subject with `as $name where {` so the diagnostic can span it",
    )
  }
  return match[1]
}

/**
 * The react-aria primitives the library wraps, read out of its own source.
 *
 * This is the deny-list for app code: if a quebi component wraps a primitive,
 * app code must import the quebi component and not reach past it. Deriving it
 * means wrapping a new primitive tomorrow forbids it in app code automatically,
 * with no list to maintain.
 *
 * Value imports only, and only PascalCase ones: `parseColor` and `useLocale`
 * have no quebi equivalent and stay importable, and type-only imports are erased
 * at build time, so banning them would be noise.
 */
export function deriveRacPrimitives(componentSources: string[]): string[] {
  const names = new Set<string>()
  for (const source of componentSources) {
    const imports = source.matchAll(
      /import\s+(type\s+)?\{([^}]*)\}\s+from\s+"react-aria-components"/g,
    )
    for (const match of imports) {
      if (match[1]) continue // `import type { ... }`
      for (const clause of match[2].split(",")) {
        const name = clause.trim().split(/\s+as\s+/)[0].trim()
        if (!name || name.startsWith("type ")) continue
        if (/^[A-Z]/.test(name)) names.add(name)
      }
    }
  }
  return [...names].sort()
}

/** The `elements` option for noRestrictedElements, derived from `replacements`. */
export function restrictedElements(rule: RuleMeta): Record<string, string> {
  const elements: Record<string, string> = {}
  for (const replacement of rule.replacements ?? []) {
    // Only intrinsics: JSX says which is which, and a rule telling people to ban
    // <Checkbox> outright would be nonsense.
    if (!/^[a-z][a-z0-9-]*$/.test(replacement.element)) continue
    const use = replacement.use
      .map((t) => `<${t.name}> from ${t.from}${t.when ? ` (${t.when})` : ""}`)
      .join(", or ")
    elements[replacement.element] = `Use ${use}.`
  }
  return elements
}

interface BiomeRuleConfig {
  level: "error" | "warn"
  options?:
    | { elements: Record<string, string> }
    | { paths: Record<string, { importNames: string[]; message: string }> }
    | Record<string, unknown>
}

/**
 * The generated config as data: what goes in `biome.jsonc`.
 *
 * There is no top-level `plugins`, and its absence is load-bearing. An override
 * *adds* its `plugins` to the files its `includes` match; it cannot subtract one
 * the top level has already loaded globally. A plugin named in both would
 * therefore run everywhere regardless of its override, which is the bug this
 * shape exists to make unrepresentable.
 */
export interface BiomeConfig {
  linter: { rules: Record<string, Record<string, BiomeRuleConfig | "off">> }
  overrides: {
    includes: string[]
    plugins?: string[]
    linter?: { rules: Record<string, Record<string, BiomeRuleConfig | "off">> }
  }[]
}

const PLUGIN_DIR = "./ui-lib-rules"

/**
 * Options for a built-in Biome rule. Each of the two is derived from a different
 * part of the record — the element ban from the replacement table, the import ban
 * from the primitives the library wraps — and neither is written by hand.
 */
function ruleOptions(rule: RuleMeta, primitives: string[]): { options?: BiomeRuleConfig["options"] } {
  const biome = rule.enforcement.biome
  if (biome?.via !== "rule") return {}
  // Options the record states outright — a threshold, say — where there is
  // nothing in the record to derive them from.
  if (biome.options) return { options: biome.options as BiomeRuleConfig["options"] }
  if (biome.rule === "style/noRestrictedImports") {
    if (primitives.length === 0) {
      throw new Error(
        `Rule "${rule.id}" bans primitive imports, but no primitives were derived — derive them from the library's component sources and pass them to buildBiomeConfig/buildRuleChecks`,
      )
    }
    return {
      options: {
        paths: {
          "react-aria-components": {
            importNames: primitives,
            message: rule.enforcement.message ?? rule.summary,
          },
        },
      },
    }
  }
  // The element ban, and only the element ban. This used to be the fall-through
  // for every other built-in, which was fine while `correctness/noRestrictedElements`
  // was the only one — and a trap the moment it was not: a rule with a
  // `replacements` table and any other Biome rule behind it would have been
  // configured with an `elements` option that rule has never heard of.
  if (biome.rule === "correctness/noRestrictedElements") {
    const elements = restrictedElements(rule)
    return Object.keys(elements).length ? { options: { elements } } : {}
  }
  // Everything else is configured by its level alone — `suspicious/noAlert` has
  // nothing to configure, and the message it prints is Biome's own.
  return {}
}

/**
 * Repo-local ignores for a plugin rule, by id. `() => []` publishes the record's
 * scope and nothing else, which is what a consumer downloads.
 */
export type LocalIgnores = (ruleId: string) => ExtraPluginIgnore[]

export function buildBiomeConfig(
  rules: RuleMeta[],
  pluginDir = PLUGIN_DIR,
  primitives: string[] = [],
  localIgnores: LocalIgnores = () => [],
): BiomeConfig {
  const linterRules: BiomeConfig["linter"]["rules"] = {}
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const [group, name] = biome.rule.split("/")
    linterRules[group] ??= {}
    linterRules[group][name] = { level: severityOf(rule), ...ruleOptions(rule, primitives) }
  }

  // Plugins first: an override that loads one says which files the rule is
  // about before any later entry says where it is relaxed. One entry per
  // distinct scope, because most of these rules share `appliesTo` and the
  // library-source carve-out, and ten identical `includes` lists would bury the
  // two that differ.
  const overrides: BiomeConfig["overrides"] = []
  for (const rule of pluginRules(rules)) {
    const includes = scopeIncludes(rule, localIgnores(rule.id))
    const key = includes.join("|")
    let override = overrides.find((o) => o.plugins && o.includes.join("|") === key)
    if (!override) {
      override = { includes, plugins: [] }
      overrides.push(override)
    }
    override.plugins?.push(`${pluginDir}/${rule.id}.grit`)
  }

  // Then one override per distinct path set, switching off the built-in rules
  // that except it.
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const paths = exceptionPaths(rule)
    if (!paths.length) continue
    const [group, name] = biome.rule.split("/")
    const key = [...paths].sort().join("|")
    let override = overrides.find((o) => o.linter && [...o.includes].sort().join("|") === key)
    if (!override) {
      override = { includes: [...paths].sort(), linter: { rules: {} } }
      overrides.push(override)
    }
    override.linter ??= { rules: {} }
    const rulesFor = override.linter.rules
    rulesFor[group] ??= {}
    // An exception that names elements leaves the rule on and removes just those
    // elements, so a carve-out for hidden inputs does not also license a
    // hand-rolled <button> in the same directory.
    const excused = new Set(
      rule.exceptions
        .filter((e) => e.paths?.some((p) => paths.includes(p)))
        .flatMap((e) => e.elements ?? []),
    )
    const remaining = Object.fromEntries(
      Object.entries(restrictedElements(rule)).filter(([element]) => !excused.has(element)),
    )
    rulesFor[group][name] =
      excused.size > 0 && Object.keys(remaining).length > 0
        ? { level: severityOf(rule), options: { elements: remaining } }
        : "off"
  }

  return {
    linter: { rules: linterRules },
    overrides,
  }
}

/** `biome.jsonc` — JSONC so each carve-out can say why it exists, in place. */
export function renderBiomeConfig(
  rules: RuleMeta[],
  baseUrl = DEFAULT_BASE_URL,
  primitives: string[] = [],
): string {
  const config = buildBiomeConfig(rules, PLUGIN_DIR, primitives)
  const plugins = pluginRules(rules)
  const body = JSON.stringify(config, null, 2).split("\n")

  // Annotate the generated JSON: every plugin line names its rule, and every
  // override names the exception it applies.
  const annotated = body.map((line) => {
    const plugin = plugins.find((r) => line.includes(`/${r.id}.grit`))
    if (plugin) return `${line} // ${plugin.title}`
    // Each exception path appears on its own line inside "includes"; annotate the
    // path itself, so a carve-out and the reason for it cannot be separated. A
    // plugin's scope writes them with a leading `!` — same path, same reason.
    const match = line.match(/^(\s*)"([^"]+)",?$/)
    const path = match?.[2]
    const carveOut = path?.replace(/^!/, "")
    if (path && carveOut && config.overrides.some((o) => o.includes.includes(path))) {
      const reasons = rules
        .flatMap((r) => r.exceptions.map((e) => ({ rule: r, exception: e })))
        .filter(({ exception }) => exception.paths?.includes(carveOut))
        .map(({ rule, exception }) => `${rule.id} — ${firstSentence(exception.reason)}`)
      return [...reasons.map((r) => `${match?.[1]}// ${r}`), line].join("\n")
    }
    return line
  })

  return [
    `// AUTO-GENERATED from ${baseUrl}/api/rules.json — do not edit by hand.`,
    "//",
    "// Every rule, message, and exception below comes from a rule record in quebi",
    `// ui-lib, so this file and ${baseUrl}/rules cannot drift apart.`,
    "//",
    "// Merge these keys into your own biome.jsonc. The `plugins` entries are",
    `// GritQL files served alongside this one — fetch them into ${PLUGIN_DIR}/:`,
    ...plugins.map((r) => `//   curl -o ${PLUGIN_DIR.slice(2)}/${r.id}.grit ${baseUrl}/api/rules/plugins/${r.id}.grit`),
    "//",
    "// Note that the plugins are listed inside `overrides` and not at the top",
    "// level, and that this is the whole of their scope. A plugin in the",
    "// top-level `plugins` is run against every file Biome lints — an override",
    "// adds one to the files it matches and cannot subtract one already loaded",
    "// globally — so listing them there would silence nothing and widen",
    "// everything. If your project lays its source out differently from app/ or",
    "// src/, edit those `includes` to match; the .grit files themselves say",
    "// nothing about paths.",
    "",
    ...annotated,
    "",
  ].join("\n")
}

/** How to install the whole thing. */
export function renderBiomeSetup(rules: RuleMeta[], baseUrl = DEFAULT_BASE_URL): string {
  const plugins = pluginRules(rules)
  return [
    "# 1. Biome, if the project does not have it yet",
    "npm i -D @biomejs/biome",
    "",
    "# 2. The GritQL plugins — one per rule Biome has no built-in for",
    `mkdir -p ${PLUGIN_DIR.slice(2)}`,
    ...plugins.map(
      (r) => `curl -o ${PLUGIN_DIR.slice(2)}/${r.id}.grit ${baseUrl}/api/rules/plugins/${r.id}.grit`,
    ),
    "",
    "# 3. The config — merge these keys into your biome.jsonc",
    `curl -O ${baseUrl}/api/rules/biome.jsonc`,
    "",
    "npx biome lint src",
    "",
  ].join("\n")
}

/** The runnable checks shown on a rule's page, all derived from its record. */
export function buildRuleChecks(
  rule: RuleMeta,
  baseUrl = DEFAULT_BASE_URL,
  primitives: string[] = [],
): RuleCheck[] {
  const checks: RuleCheck[] = []
  const biome = rule.enforcement.biome
  const ignores = exceptionPaths(rule)
  const severity = severityOf(rule)

  if (biome?.via === "rule") {
    const [group, name] = biome.rule.split("/")
    // The same options the generated biome.jsonc gets — a threshold for the
    // rules whose configuration *is* their content, the element ban for the
    // element rules, the import ban for the primitives one. Rendering
    // `{ elements: ... }` for all of them published a keep-files-readable page
    // whose snippet silently dropped the 500-line limit.
    const config = {
      linter: {
        rules: { [group]: { [name]: { level: severity, ...ruleOptions(rule, primitives) } } },
      },
      ...(ignores.length
        ? {
            overrides: [
              { includes: ignores, linter: { rules: { [group]: { [name]: "off" } } } },
            ],
          }
        : {}),
    }
    checks.push({
      tool: "biome",
      title: `Biome — ${biome.rule}`,
      description:
        "A built-in Biome rule, so there is nothing to install and no pattern to maintain. One message per element, and the documented exceptions are ordinary `overrides`.",
      language: "json",
      code: `// biome.jsonc\n${JSON.stringify(config, null, 2)}\n`,
    })
  }

  if (biome?.via === "plugin") {
    checks.push({
      tool: "biome",
      title: `Biome — GritQL plugin`,
      description: `Biome has no built-in rule for this one, so it ships as a GritQL plugin. Save it as ${PLUGIN_DIR.slice(2)}/${rule.id}.grit and load it from an \`overrides\` entry — the one in the file's own header, which lists the paths the rule applies to (${rule.appliesTo.join(", ")}) and the paths its documented exceptions carve back out. Not from the top-level \`plugins\`: a plugin listed there runs against every file you lint, and an override can add one but cannot take one away. If your project keeps its components somewhere else, edit the \`includes\` to match.`,
      language: "js",
      code: renderGritPlugin(rule, baseUrl),
    })
  }

  if (rule.enforcement.grep) {
    checks.push({
      tool: "ripgrep",
      title: "ripgrep — no setup at all",
      description:
        "Finds candidates for review in any repo, linter or not. Coarser than the Biome check: it reads lines, not syntax, so expect false positives and treat a clean run as weaker evidence than a clean lint run.",
      language: "bash",
      code: [
        `# ${rule.id} — candidates for review`,
        `rg -n -g '${grepGlob(rule)}' \\`,
        ...ignores.map((path) => `  -g '!${path}' \\`),
        `  ${JSON.stringify(rule.enforcement.grep)}`,
        "",
      ].join("\n"),
    })
  }

  const judgementCalls = rule.exceptions.filter((e) => !e.paths?.length)
  if (judgementCalls.length > 0 && biome) {
    // A plugin diagnostic is suppressed by the plugin's name, which Biome takes
    // from the .grit file's name — so `lint/plugin/<rule id>` for a plugin saved
    // where the plugin check above says to save it. The bare `lint/plugin`
    // category also works, and quiets every plugin rule on the node at once;
    // that is the form not to publish. (Until task #224 this printed `plugin:`
    // with no `lint/`, which Biome accepts and applies to nothing.)
    const target = biome.via === "rule" ? `lint/${biome.rule}` : `lint/plugin/${rule.id}`
    const pluginNote =
      biome.via === "plugin"
        ? ` The rule is named by its plugin's file name, ${rule.id}.grit — a suppression that names this rule quiets this rule and no other plugin on the same line, and if the file is renamed Biome reports the comment as having no effect rather than guessing. \`lint/plugin\` on its own is valid too and quiets every plugin rule on the node at once; name the rule instead.`
        : ""
    checks.push({
      tool: "biome",
      title: "Claiming an exception that is not a path",
      description: `${judgementCalls.length === 1 ? "One exception on this rule is" : `${judgementCalls.length} exceptions on this rule are`} a judgement call, so ${judgementCalls.length === 1 ? "it" : "they"} cannot be a path. Biome's suppression syntax has a slot for the reason — fill it, because that note is what makes the carve-out reviewable instead of invisible.${pluginNote}`,
      language: "tsx",
      // The line form, because it is the one that works everywhere a violation
      // can be: above a call, an import, or a JSX attribute. Only directly
      // between JSX children does a comment have to be an expression, and this
      // rule set has as many non-JSX violations as JSX ones, so the wrapping is
      // stated rather than assumed.
      code: [
        ...judgementCalls.map(
          (exception) =>
            `// biome-ignore ${target}: ${exception.scope} — ${firstSentence(exception.reason)}`,
        ),
        "",
        "// Between JSX children, where a comment has to be an expression, the same",
        "// line is written {/* biome-ignore … */}.",
      ].join("\n"),
    })
  }

  return checks
}

export { DEFAULT_BASE_URL, PLUGIN_DIR }
