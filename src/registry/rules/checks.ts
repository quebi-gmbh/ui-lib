/**
 * Turning rule records into runnable Biome checks.
 *
 * This module is the only place that knows how a rule becomes a Biome rule, a
 * GritQL plugin, or a ripgrep command. `scripts/generate-api.ts` writes its
 * output into `public/api/rules/**`; the test suite feeds the same output to the
 * Biome CLI, so what is tested is what ships.
 *
 * Biome carries a rule one of two ways, and both are scoped by the same
 * mechanism — `overrides`, whose globs Biome matches against the project root:
 *
 *  - a **built-in rule** (`correctness/noRestrictedElements`) is switched on in
 *    `biome.jsonc` and switched off again by an `overrides` entry per exception;
 *  - a **GritQL plugin** is *loaded* by an `overrides` entry, and that entry is
 *    also its whole scope: the paths the rule applies to, with its exceptions
 *    negated behind them. A plugin cannot be unloaded by a later override, so
 *    there is nowhere else for a plugin's scope to live.
 *
 * Both come from the same `exceptions[].paths`. Nothing here is hand-written per
 * rule: a check that cannot be derived from a record is a check that can drift
 * away from the rule it claims to enforce.
 */
import {
  exceptionPaths,
  firstSentence,
  grepGlob,
  pluginScopeIncludes,
} from "./scope"
import type { RuleCheck, RuleMeta } from "./types"

// Path-scope translation lives in ./scope, and is re-exported here so that the
// generators and the tests keep one import for the whole of a rule's checks.
export { exceptionPaths, firstSentence, grepGlob, pluginScopeIncludes }

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
 * A path a project switches a plugin rule off for, that is not one of the rule's
 * published exceptions.
 *
 * It becomes a negated pattern on the `overrides` entry that loads the plugin,
 * and `reason` is written into `biome.jsonc` beside it, so a carve-out and the
 * argument for it stay together — the same discipline the published exceptions
 * follow.
 */
export interface ExtraPluginIgnore {
  glob: string
  reason: string
}

/**
 * The plugin file for one rule: the pattern and its diagnostic, and nothing
 * about where it applies.
 *
 * Scope is deliberately absent. It used to be here, as `$filename` guards
 * compiled from the record's globs, and that was wrong in a way no guard can
 * fix: `$filename` is absolute, a record's globs are project-relative, and
 * nothing in an absolute path says where the project root is. See `./scope`.
 * The file names the include list it expects instead, so a reader who finds the
 * plugin on its own knows what is missing.
 */
export function renderGritPlugin(rule: RuleMeta, baseUrl = DEFAULT_BASE_URL): string {
  const enforcement = rule.enforcement.biome
  if (enforcement?.via !== "plugin") {
    throw new Error(`Rule "${rule.id}" is not carried by a GritQL plugin`)
  }
  assertRegexLiteralsClose(rule, enforcement.pattern)
  assertMessageHasNoDoubleQuotes(rule, rule.enforcement.message ?? rule.summary)
  // The pattern ends with its last `where` clause; the diagnostic is a further
  // clause, so the two are joined with a comma rather than glued on.
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
    "// This file says nothing about where the rule applies. Load it from an",
    "// `overrides` entry in biome.jsonc whose `includes` are:",
    `//   ${JSON.stringify(pluginScopeIncludes(rule))}`,
    "// Biome matches those globs against your project root. A guard inside this",
    "// file could not: GritQL's $filename is absolute, so a relative glob would",
    "// also be satisfied by a directory above the checkout — a tree kept under",
    "// ~/src would put every file in it in scope, and every exception too.",
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

type BiomeRules = Record<string, Record<string, BiomeRuleConfig | "off">>

/**
 * One `overrides` entry. Either it loads a plugin for the paths a rule claims,
 * or it relaxes a built-in rule for the paths a rule excepts — never both, so
 * that each entry reads as one decision.
 */
export interface BiomeOverride {
  includes: string[]
  plugins?: string[]
  linter?: { rules: BiomeRules }
}

/**
 * The generated config as data: what goes in `biome.jsonc`.
 *
 * There is no top-level `plugins` key, and its absence is the fix for a real
 * bug rather than a tidying: a plugin listed there is loaded for every file the
 * project lints, which left its scope to be guessed from an absolute path
 * inside the pattern. Loading it from an `overrides` entry makes the scope
 * Biome's job, and Biome knows where the project root is.
 */
export interface BiomeConfig {
  linter: { rules: BiomeRules }
  overrides: BiomeOverride[]
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
 * @param pluginIgnores extra paths to switch a plugin rule off for, beyond its
 *   published exceptions — a project's own carve-outs, keyed by rule id.
 */
export function buildBiomeConfig(
  rules: RuleMeta[],
  pluginDir = PLUGIN_DIR,
  primitives: string[] = [],
  pluginIgnores: (ruleId: string) => string[] = () => [],
): BiomeConfig {
  const linterRules: BiomeRules = {}
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const [group, name] = biome.rule.split("/")
    linterRules[group] ??= {}
    linterRules[group][name] = { level: severityOf(rule), ...ruleOptions(rule, primitives) }
  }

  // Plugin rules first: one entry each, loading the plugin for exactly the paths
  // the record claims. This is the only place a plugin's scope is stated, so the
  // entry carries both halves of it — `appliesTo`, then everything negated.
  // `plugins` before `includes` so that the rendered JSONC reads in that order
  // too: which rule this entry is about, then where it applies. The annotator
  // puts the rule's title above the first line of the entry it can find.
  const overrides: BiomeOverride[] = pluginRules(rules).map((rule) => ({
    plugins: [`${pluginDir}/${rule.id}.grit`],
    includes: pluginScopeIncludes(rule, pluginIgnores(rule.id)),
  }))

  // Then one override per distinct path set, switching off the built-in rules
  // that except it.
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const paths = exceptionPaths(rule)
    if (!paths.length) continue
    const [group, name] = biome.rule.split("/")
    const key = [...paths].sort().join("|")
    // Only among the built-in entries: a plugin entry can never share a path set
    // with one of these (it leads with `appliesTo`), but merging a rule relaxation
    // into an entry whose job is to load a plugin would read as one decision when
    // it is two.
    let override = overrides.find(
      (o) => o.linter && [...o.includes].sort().join("|") === key,
    ) as (BiomeOverride & { linter: { rules: BiomeRules } }) | undefined
    if (!override) {
      override = { includes: [...paths].sort(), linter: { rules: {} } }
      overrides.push(override)
    }
    override.linter.rules[group] ??= {}
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
    override.linter.rules[group][name] =
      excused.size > 0 && Object.keys(remaining).length > 0
        ? { level: severityOf(rule), options: { elements: remaining } }
        : "off"
  }

  return { linter: { rules: linterRules }, overrides }
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
  //
  // An entry is annotated with the reasons *it* encodes. `src/components/**` is
  // excepted by nine rules, and each plugin now has an entry naming it, so
  // "every reason that mentions this path" would print all nine on all of them
  // and bury the one the reader is looking at. A plugin's entry therefore speaks
  // only for its own rule, and a built-in exception entry only for the built-ins
  // it switches off.
  const builtInIds = new Set(builtInRules(rules).map((r) => r.id))
  let entryRule: string | null = null

  const annotated = body.map((line) => {
    if (/^ {4}\{$/.test(line)) entryRule = null
    const plugin = plugins.find((r) => line.includes(`/${r.id}.grit`))
    if (plugin) {
      entryRule = plugin.id
      return `${line} // ${plugin.title}`
    }
    // Each exception path appears on its own line inside "includes"; annotate the
    // path itself, so a carve-out and the reason for it cannot be separated. On a
    // plugin's entry the same path is written `!…`, because there the exception
    // is a pattern that subtracts rather than an override that switches off —
    // same carve-out, same reason, so the `!` is stripped before looking it up.
    const match = line.match(/^(\s*)"([^"]+)",?$/)
    const path = match?.[2]?.replace(/^!/, "")
    if (path && config.overrides.some((o) => o.includes.some((i) => i.replace(/^!/, "") === path))) {
      const speakingFor = entryRule ? new Set([entryRule]) : builtInIds
      const reasons = rules
        .filter((r) => speakingFor.has(r.id))
        .flatMap((r) => r.exceptions.map((e) => ({ rule: r, exception: e })))
        .filter(({ exception }) => exception.paths?.includes(path))
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
    "// Merge these keys into your own biome.jsonc. The plugins are GritQL files",
    `// served alongside this one — fetch them into ${PLUGIN_DIR}/:`,
    ...plugins.map((r) => `//   curl -o ${PLUGIN_DIR.slice(2)}/${r.id}.grit ${baseUrl}/api/rules/plugins/${r.id}.grit`),
    "//",
    "// Each plugin is loaded by an `overrides` entry rather than by a top-level",
    "// `plugins` list, because that entry is also the rule's scope: the paths it",
    "// applies to, then the paths its exceptions carve back out, negated. Biome",
    "// matches those globs against your project root, which is the one thing a",
    "// guard inside the .grit file could not do — GritQL's $filename is absolute,",
    "// so `src/**` there is also satisfied by a checkout kept under ~/src.",
    "//",
    "// If your project lays its source out differently from app/ or src/, widen",
    "// the `includes` on the entry that loads the plugin — that is the only place",
    "// its scope is stated, so nothing else has to be changed to match.",
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
      description: `Biome has no built-in rule for this one, so it ships as a GritQL plugin. Save it as ${PLUGIN_DIR.slice(2)}/${rule.id}.grit. The file is the pattern and the message only — where the rule applies is the config entry below, because a plugin sees an absolute path and a rule's scope is written relative to your project root.`,
      language: "js",
      code: renderGritPlugin(rule, baseUrl),
    })
    checks.push({
      tool: "biome",
      title: "Biome — loading the plugin, and its scope",
      description: `An \`overrides\` entry loads the plugin, and its \`includes\` are the whole of this rule's scope: the paths it applies to (${rule.appliesTo.join(", ")})${ignores.length ? `, with its documented exceptions negated behind them` : ""}. Biome cannot unload a plugin in a later override, so there is nowhere else for that to be said. If your project keeps its components somewhere else, widen the \`includes\`.`,
      language: "json",
      code: `// biome.jsonc\n${JSON.stringify(
        {
          overrides: [
            {
              plugins: [`${PLUGIN_DIR}/${rule.id}.grit`],
              includes: pluginScopeIncludes(rule),
            },
          ],
        },
        null,
        2,
      )}\n`,
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
    const target = biome.via === "rule" ? `lint/${biome.rule}` : "plugin"
    checks.push({
      tool: "biome",
      title: "Claiming an exception that is not a path",
      description: `${judgementCalls.length === 1 ? "One exception on this rule is" : `${judgementCalls.length} exceptions on this rule are`} a judgement call, so ${judgementCalls.length === 1 ? "it" : "they"} cannot be a path. Biome's suppression syntax has a slot for the reason — fill it, because that note is what makes the carve-out reviewable instead of invisible.`,
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
