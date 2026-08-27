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
 *    the pattern as `$filename` guards.
 *
 * Both come from the same `exceptions[].paths`. Nothing here is hand-written per
 * rule: a check that cannot be derived from a record is a check that can drift
 * away from the rule it claims to enforce.
 */
import type { RuleCheck, RuleMeta } from "./types"

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

/** Path globs a rule's exceptions carve out (the ones expressible as paths). */
export function exceptionPaths(rule: RuleMeta): string[] {
  return [...new Set(rule.exceptions.flatMap((e) => e.paths ?? []))]
}

/** First sentence of a justification, for a one-line comment. */
export function firstSentence(text: string) {
  const match = text.match(/^.*?[.;](?=\s|$)/)
  return (match ? match[0] : text).trim()
}

/**
 * A path glob as a regex fragment for a GritQL `$filename` guard. `$filename`
 * is the file's path, so the pattern is deliberately unanchored at the front:
 * `components/ui/**` has to match whatever prefix the project puts in front of it.
 */
export function globToFilenameRegex(glob: string): string {
  let out = ""
  let i = 0
  while (i < glob.length) {
    if (glob.startsWith("**/", i)) {
      // Any number of directories, including none, so a file at the project
      // root is covered by the same glob as one nested five deep.
      out += "(?:.*/)?"
      i += 3
    } else if (glob.startsWith("**", i)) {
      out += ".*"
      i += 2
    } else if (glob[i] === "*") {
      out += "[^/]*"
      i += 1
    } else if (glob[i] === "{") {
      const close = glob.indexOf("}", i)
      if (close === -1) throw new Error(`Unclosed brace in exception glob "${glob}"`)
      out += `(?:${glob.slice(i + 1, close).split(",").join("|")})`
      i = close + 1
    } else {
      out += glob[i].replace(/[.+^$()|[\]\\]/, "\\$&")
      i += 1
    }
  }
  // A glob ending in ** already covers the tail; anything else names a file, so
  // anchoring stops `components/ui/**` being satisfied by a lookalike path.
  const anchored = glob.endsWith("**") ? out : `${out}$`
  return glob.startsWith("**") ? anchored : `.*${anchored}`
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

/** The plugin file for one rule: the pattern, its exception guards, its diagnostic. */
export function renderGritPlugin(rule: RuleMeta, baseUrl = DEFAULT_BASE_URL): string {
  const enforcement = rule.enforcement.biome
  if (enforcement?.via !== "plugin") {
    throw new Error(`Rule "${rule.id}" is not carried by a GritQL plugin`)
  }
  assertRegexLiteralsClose(rule, enforcement.pattern)
  // The pattern ends with its last `where` clause; guards and the diagnostic are
  // further clauses, so everything is joined with a comma rather than glued on.
  const clauses = [
    enforcement.pattern,
    ...exceptionPaths(rule).map(
      (glob) =>
        `  // documented exception: ${glob}\n  not $filename <: r"${globToFilenameRegex(glob)}"`,
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
  options?: { elements: Record<string, string> }
}

/** The generated config as data: what goes in `biome.jsonc`. */
export interface BiomeConfig {
  plugins: string[]
  linter: { rules: Record<string, Record<string, BiomeRuleConfig | "off">> }
  overrides: { includes: string[]; linter: { rules: Record<string, Record<string, "off">> } }[]
}

const PLUGIN_DIR = "./ui-lib-rules"

export function buildBiomeConfig(rules: RuleMeta[], pluginDir = PLUGIN_DIR): BiomeConfig {
  const linterRules: BiomeConfig["linter"]["rules"] = {}
  for (const rule of builtInRules(rules)) {
    const biome = rule.enforcement.biome
    if (biome?.via !== "rule") continue
    const [group, name] = biome.rule.split("/")
    const elements = restrictedElements(rule)
    linterRules[group] ??= {}
    linterRules[group][name] = {
      level: severityOf(rule),
      ...(Object.keys(elements).length ? { options: { elements } } : {}),
    }
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
    override.linter.rules[group][name] = "off"
  }

  return {
    plugins: pluginRules(rules).map((r) => `${pluginDir}/${r.id}.grit`),
    linter: { rules: linterRules },
    overrides,
  }
}

/** `biome.jsonc` — JSONC so each carve-out can say why it exists, in place. */
export function renderBiomeConfig(rules: RuleMeta[], baseUrl = DEFAULT_BASE_URL): string {
  const config = buildBiomeConfig(rules)
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
    "// exceptions as $filename guards inside the pattern. The overrides below",
    "// therefore only cover the built-in rules.",
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
export function buildRuleChecks(rule: RuleMeta, baseUrl = DEFAULT_BASE_URL): RuleCheck[] {
  const checks: RuleCheck[] = []
  const biome = rule.enforcement.biome
  const ignores = exceptionPaths(rule)
  const severity = severityOf(rule)

  if (biome?.via === "rule") {
    const [group, name] = biome.rule.split("/")
    const config = {
      linter: {
        rules: { [group]: { [name]: { level: severity, options: { elements: restrictedElements(rule) } } } },
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
      description: `Biome has no built-in rule for this one, so it ships as a GritQL plugin. Save it as ${PLUGIN_DIR.slice(2)}/${rule.id}.grit and add that path to \`plugins\` in your biome.jsonc. Its documented exceptions are compiled in as \`$filename\` guards, because Biome's overrides do not scope plugins.`,
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
        "rg -n -g '*.{tsx,jsx}' \\",
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
      code: judgementCalls
        .map(
          (exception) =>
            `{/* biome-ignore ${target}: ${exception.scope} — ${firstSentence(exception.reason)} */}`,
        )
        .join("\n\n"),
    })
  }

  return checks
}

export { DEFAULT_BASE_URL, PLUGIN_DIR }
