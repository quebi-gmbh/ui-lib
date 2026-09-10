/**
 * Turning rule records into runnable Biome checks.
 *
 * This module is the only place that knows how a rule becomes a Biome rule, a
 * GritQL plugin, or a ripgrep command. `scripts/generate-api.ts` writes its
 * output into `public/api/rules/**`; the test suite feeds the same output to the
 * Biome CLI, so what is tested is what ships.
 *
 * Biome carries a rule one of two ways, and the difference decides how the
 * rule's documented exceptions are applied:
 *
 *  - a **built-in rule** (`correctness/noRestrictedElements`) is configured in
 *    `biome.jsonc`, so its exceptions are `overrides` entries — Biome's own
 *    path-scoping mechanism;
 *  - a **GritQL plugin** is loaded globally (`overrides` cannot scope plugins,
 *    which is verified in the test suite), so its exceptions are compiled into
 *    the pattern as `$filename` guards — and so is its `appliesTo`, because a
 *    globally loaded plugin has no other way to say which files it is about.
 *
 * Both come from the same `exceptions[].paths`. Nothing here is hand-written per
 * rule: a check that cannot be derived from a record is a check that can drift
 * away from the rule it claims to enforce.
 */
import {
  appliesToFilenameRegex,
  exceptionPaths,
  firstSentence,
  globToFilenameRegex,
  grepGlob,
} from "./scope"
import type { RuleCheck, RuleMeta } from "./types"

// Path-scope translation lives in ./scope, and is re-exported here so that the
// generators and the tests keep one import for the whole of a rule's checks.
export { appliesToFilenameRegex, exceptionPaths, firstSentence, globToFilenameRegex, grepGlob }

const DEFAULT_BASE_URL = "https://ui-lib.quebi.de"

/** Biome severities. A rule's declared severity is used verbatim — no clamping. */
function severityOf(rule: RuleMeta): "error" | "warn" {
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
 * An extra `$filename` guard that is not one of the rule's published exceptions.
 *
 * Biome's `overrides` cannot scope plugins, so a project that needs a plugin
 * rule switched off somewhere has to compile the guard into its own copy of the
 * plugin. `reason` is written into the file next to the guard, so a carve-out
 * and the argument for it stay together — the same discipline the published
 * exceptions follow.
 */
export interface ExtraPluginIgnore {
  glob: string
  reason: string
}

/** The plugin file for one rule: the pattern, its exception guards, its diagnostic. */
export function renderGritPlugin(
  rule: RuleMeta,
  baseUrl = DEFAULT_BASE_URL,
  extraIgnores: ExtraPluginIgnore[] = [],
): string {
  const enforcement = rule.enforcement.biome
  if (enforcement?.via !== "plugin") {
    throw new Error(`Rule "${rule.id}" is not carried by a GritQL plugin`)
  }
  assertRegexLiteralsClose(rule, enforcement.pattern)
  assertMessageHasNoDoubleQuotes(rule, rule.enforcement.message ?? rule.summary)
  // The pattern ends with its last `where` clause; guards and the diagnostic are
  // further clauses, so everything is joined with a comma rather than glued on.
  const clauses = [
    enforcement.pattern,
    // Scope first, exceptions second: the rule says where it applies before it
    // says where it does not.
    `  // applies to: ${rule.appliesTo.join(", ")}\n  $filename <: r"${appliesToFilenameRegex(rule)}"`,
    ...exceptionPaths(rule).map(
      (glob) =>
        `  // documented exception: ${glob}\n  not $filename <: r"${globToFilenameRegex(glob)}"`,
    ),
    ...extraIgnores.map(
      ({ glob, reason }) =>
        `  // local scope: ${glob} — ${reason}\n  not $filename <: r"${globToFilenameRegex(glob)}"`,
    ),
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

/** The generated config as data: what goes in `biome.jsonc`. */
export interface BiomeConfig {
  plugins: string[]
  linter: { rules: Record<string, Record<string, BiomeRuleConfig | "off">> }
  overrides: {
    includes: string[]
    linter: { rules: Record<string, Record<string, BiomeRuleConfig | "off">> }
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

export function buildBiomeConfig(
  rules: RuleMeta[],
  pluginDir = PLUGIN_DIR,
  primitives: string[] = [],
): BiomeConfig {
  const linterRules: BiomeConfig["linter"]["rules"] = {}
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const [group, name] = biome.rule.split("/")
    linterRules[group] ??= {}
    linterRules[group][name] = { level: severityOf(rule), ...ruleOptions(rule, primitives) }
  }

  // One override per distinct path set, switching off the built-in rules that
  // except it. Plugin rules carry their own exceptions inside the pattern.
  const overrides: BiomeConfig["overrides"] = []
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const paths = exceptionPaths(rule)
    if (!paths.length) continue
    const [group, name] = biome.rule.split("/")
    const key = [...paths].sort().join("|")
    let override = overrides.find((o) => [...o.includes].sort().join("|") === key)
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

  return {
    plugins: pluginRules(rules).map((r) => `${pluginDir}/${r.id}.grit`),
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
    // path itself, so a carve-out and the reason for it cannot be separated.
    const match = line.match(/^(\s*)"([^"]+)",?$/)
    const path = match?.[2]
    if (path && config.overrides.some((o) => o.includes.includes(path))) {
      const reasons = rules
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
    "// Merge these keys into your own biome.jsonc. The `plugins` entries are",
    `// GritQL files served alongside this one — fetch them into ${PLUGIN_DIR}/:`,
    ...plugins.map((r) => `//   curl -o ${PLUGIN_DIR.slice(2)}/${r.id}.grit ${baseUrl}/api/rules/plugins/${r.id}.grit`),
    "//",
    "// Biome's overrides do not scope plugins, so each plugin carries its own",
    "// scope as $filename guards inside the pattern: the paths the rule applies",
    "// to, and the paths its exceptions carve back out. The overrides below",
    "// therefore only cover the built-in rules. If your project lays its source",
    "// out differently from app/ or src/, widen the `applies to` guard in each",
    "// .grit file to match — otherwise the plugin rules report nothing.",
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
      description: `Biome has no built-in rule for this one, so it ships as a GritQL plugin. Save it as ${PLUGIN_DIR.slice(2)}/${rule.id}.grit and add that path to \`plugins\` in your biome.jsonc. Because Biome's overrides do not scope plugins, both halves of this rule's scope are compiled in as \`$filename\` guards: the paths it applies to (${rule.appliesTo.join(", ")}) and the paths its documented exceptions carve back out. If your project keeps its components somewhere else, widen the first guard to match.`,
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
