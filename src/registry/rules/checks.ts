/**
 * Turning rule records into runnable checks.
 *
 * This module is the only place that knows how a rule becomes an ESLint entry,
 * a ripgrep command, or a config block. `scripts/generate-api.ts` renders its
 * output into `public/api/rules/**`; the test suite imports the same functions
 * and runs the config objects through ESLint, so what is tested is what ships.
 *
 * Nothing here is hand-written per rule — a check that cannot be derived from a
 * record is a check that can drift away from the rule it claims to enforce.
 */
import type { RuleCheck, RuleMeta } from "./types"

const DEFAULT_BASE_URL = "https://ui-lib.quebi.de"

/**
 * Minimal glob -> RegExp for the `paths` on a rule exception (`**` and `*` only).
 * Used to work out which documented exceptions overlap when the config is
 * assembled — see buildEslintBlocks.
 */
export function globToRegExp(glob: string): RegExp {
  const source = glob
    .split("**")
    .map((part) => part.replace(/[.+^${}()|[\]\\?]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join(".*")
  return new RegExp(`^${source}$`)
}

/** First sentence of a justification, for a one-line comment in generated config. */
export function firstSentence(text: string) {
  const match = text.match(/^.*?[.;](?=\s|$)/)
  return (match ? match[0] : text).trim()
}

/**
 * The JSX/TSX subset of a rule's `appliesTo`. The selectors are JSX selectors,
 * so a `.css` glob would hand ESLint files its parser has no business reading —
 * CSS-side coverage is a separate check (see each rule's enforcement note).
 */
export function jsxGlobs(globs: string[]): string[] {
  const stripped = globs
    .map((glob) =>
      glob.replace(/\{([^}]*)\}/, (_, inner: string) => {
        const kept = inner.split(",").filter((ext) => ext === "tsx" || ext === "jsx")
        return kept.length ? `{${kept.join(",")}}` : inner
      }),
    )
    .filter((glob) => /tsx|jsx/.test(glob))
  return [...new Set(stripped)]
}

/** Path globs a rule's exceptions carve out (the ones expressible as paths). */
export function exceptionPaths(rule: RuleMeta): string[] {
  return [...new Set(rule.exceptions.flatMap((e) => e.paths ?? []))]
}

/** Rules whose enforcement is a lint selector, in registry order. */
export function lintRules(rules: RuleMeta[]): RuleMeta[] {
  return rules.filter((r) => r.enforcement.kind === "lint" && r.enforcement.selector)
}

/** One `no-restricted-syntax` entry as ESLint consumes it. */
export interface RestrictedSyntaxEntry {
  selector: string
  message: string
}

/** A flat-config object, plus the commentary the rendered file carries above it. */
export interface EslintBlock {
  files: string[]
  entries: RestrictedSyntaxEntry[]
  /** Rule ids each entry came from, aligned with `entries`. */
  ruleIds: string[]
  /** "Documented exceptions: <rule> — <reason>" lines; empty for the base block. */
  comments: string[]
}

/**
 * The config as data.
 *
 * Two wrinkles, both inherent to `no-restricted-syntax` rather than to the
 * records, and both surfaced in the rendered file's comments rather than papered
 * over:
 *
 *  - it is a single rule key, so it carries ONE severity for all of its entries;
 *    a rule declared `warn` is reported at `error`.
 *  - it is a single rule key, so a documented exception cannot switch off one
 *    entry. Instead each distinct set of exception paths gets its own config
 *    object that re-declares the rule with only the entries that still apply
 *    there — accumulating the exceptions of any broader path group, so a narrow
 *    carve-out does not silently re-enable what a broader one turned off.
 */
export function buildEslintBlocks(rules: RuleMeta[]): EslintBlock[] {
  const applicable = lintRules(rules)
  const entryFor = (rule: RuleMeta): RestrictedSyntaxEntry => ({
    selector: rule.enforcement.selector as string,
    message: rule.enforcement.message as string,
  })
  const block = (scope: string[], forRules: RuleMeta[], comments: string[] = []): EslintBlock => ({
    files: scope,
    entries: forRules.map(entryFor),
    ruleIds: forRules.map((r) => r.id),
    comments,
  })

  // Distinct exception path-sets, each with the rules it relaxes.
  const groups: { paths: string[]; reasons: string[]; disabled: Set<string> }[] = []
  for (const rule of applicable) {
    for (const exception of rule.exceptions) {
      if (!exception.paths?.length) continue
      // Sort the key: two rules listing the same globs in a different order are
      // the same carve-out, and emitting them as two blocks means the later one
      // silently re-enables what the earlier one relaxed.
      const paths = [...exception.paths].sort()
      const key = paths.join("|")
      let group = groups.find((g) => g.paths.join("|") === key)
      if (!group) {
        group = { paths, reasons: [], disabled: new Set() }
        groups.push(group)
      }
      group.disabled.add(rule.id)
      group.reasons.push(`${rule.id} — ${firstSentence(exception.reason)}`)
    }
  }

  // A group also inherits every exception of a group whose globs cover its own
  // paths (e.g. src/components/** covers src/components/energy-class-badge.tsx).
  const covers = (a: (typeof groups)[number], b: (typeof groups)[number]) =>
    a !== b && a.paths.some((p) => b.paths.some((q) => globToRegExp(p).test(q)))
  for (const group of groups) {
    for (const other of groups) {
      if (covers(other, group)) for (const id of other.disabled) group.disabled.add(id)
    }
  }
  // Broad blocks first: later config objects win in flat config, so the narrow
  // ones must come last.
  const breadth = new Map(groups.map((g) => [g, groups.filter((o) => covers(g, o)).length]))
  groups.sort((a, b) => (breadth.get(b) ?? 0) - (breadth.get(a) ?? 0))

  return [
    block(jsxGlobs(applicable.flatMap((r) => r.appliesTo)).sort(), applicable),
    ...groups.map((group) =>
      block(
        group.paths,
        applicable.filter((r) => !group.disabled.has(r.id)),
        group.reasons,
      ),
    ),
  ]
}

/** The blocks as an ESLint flat config array, ready to hand to the Linter. */
export function buildEslintConfig(rules: RuleMeta[]) {
  return buildEslintBlocks(rules).map((b) => ({
    files: b.files,
    rules: {
      "no-restricted-syntax":
        b.entries.length === 0
          ? ("off" as const)
          : (["error", ...b.entries] as ["error", ...RestrictedSyntaxEntry[]]),
    },
  }))
}

/** An array of strings as readable JS source: ["a", "b"]. */
function jsArray(values: string[]) {
  return `[${values.map((v) => JSON.stringify(v)).join(", ")}]`
}

/** One entry, rendered as readable JS with the rule it came from named above it. */
function renderEntry(rule: RuleMeta, indent: string) {
  return [
    `${indent}{`,
    `${indent}  // ${rule.id} (${rule.tier ? `tier ${rule.tier}, ` : ""}declared ${rule.severity})`,
    `${indent}  selector:`,
    `${indent}    ${JSON.stringify(rule.enforcement.selector)},`,
    `${indent}  message:`,
    `${indent}    ${JSON.stringify(rule.enforcement.message)},`,
    `${indent}},`,
  ].join("\n")
}

/** The publishable `eslint.config.js`, rendered from the same blocks. */
export function renderEslintConfig(rules: RuleMeta[], baseUrl = DEFAULT_BASE_URL): string {
  const applicable = lintRules(rules)
  const byId = new Map(applicable.map((r) => [r.id, r]))
  const warned = applicable.filter((r) => r.severity !== "error").map((r) => r.id)
  const blocks = buildEslintBlocks(rules)

  const renderBlock = (block: EslintBlock) => {
    const body =
      block.entries.length === 0
        ? ['      "no-restricted-syntax": "off",']
        : [
            '      "no-restricted-syntax": [',
            '        "error",',
            ...block.ruleIds.map((id) => renderEntry(byId.get(id) as RuleMeta, "        ")),
            "      ],",
          ]
    return [
      ...(block.comments.length
        ? ["  // Documented exceptions:", ...block.comments.map((r) => `  //   ${r}`)]
        : []),
      "  {",
      `    files: ${jsArray(block.files)},`,
      "    rules: {",
      ...body,
      "    },",
      "  },",
    ].join("\n")
  }

  return [
    `// AUTO-GENERATED from ${baseUrl}/api/rules.json — do not edit by hand.`,
    "//",
    "// Every selector, message, and ignore below comes from a rule record in quebi",
    `// ui-lib, so this file and ${baseUrl}/rules cannot drift apart. Regenerate with:`,
    `//   curl -O ${baseUrl}/api/rules/eslint.config.js`,
    "//",
    "// Merge these objects into your own flat config, or spread the default export",
    "// into it. The selectors match JSX nodes, so the files they cover need a",
    "// parser that produces them — if your config does not set one already, put",
    "// this in front (npm i -D @typescript-eslint/parser):",
    "//",
    '//   import parser from "@typescript-eslint/parser"',
    '//   { files: ["**/*.{tsx,jsx}"], languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } } },',
    ...(warned.length
      ? [
          "//",
          "// Caveat: `no-restricted-syntax` is one rule key, so it carries a single",
          `// severity for every entry. ${warned.join(", ")} ${warned.length === 1 ? "is" : "are"} declared \`warn\` in the`,
          "// records and reported at `error` here; move that entry into its own config",
          "// object if you want it softer.",
        ]
      : []),
    "",
    "export default [",
    blocks.map(renderBlock).join("\n\n"),
    "]",
    "",
  ].join("\n")
}

/** The steps that make the config above runnable in a project. */
export function renderEslintSetup(baseUrl = DEFAULT_BASE_URL): string {
  return [
    "# 1. A parser that emits JSX nodes (skip if your config already has one)",
    "npm i -D eslint @typescript-eslint/parser",
    "",
    "# 2. The generated config — every ui-lib rule, with its documented exceptions",
    `curl -o ui-lib.eslint.config.js ${baseUrl}/api/rules/eslint.config.js`,
    "",
    "# 3. Point your own flat config at it",
    "cat > eslint.config.js <<'EOF'",
    'import parser from "@typescript-eslint/parser"',
    'import uiLibRules from "./ui-lib.eslint.config.js"',
    "",
    "export default [",
    '  { files: ["**/*.{tsx,jsx}"], languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } } },',
    "  ...uiLibRules,",
    "]",
    "EOF",
    "",
    "npx eslint src",
    "",
  ].join("\n")
}

/** The runnable checks shown on a rule's page, all derived from its record. */
export function buildRuleChecks(rule: RuleMeta): RuleCheck[] {
  const checks: RuleCheck[] = []
  const ignores = exceptionPaths(rule)
  const severity = rule.severity === "error" ? "error" : "warn"

  if (rule.enforcement.selector && rule.enforcement.message) {
    checks.push({
      tool: "eslint",
      title: "ESLint — no-restricted-syntax",
      description:
        "This rule on its own, at the severity it is declared with, and its documented exceptions already ignored. Needs a parser that emits JSX nodes (typescript-eslint).",
      language: "js",
      code: [
        "// eslint.config.js",
        "export default [",
        "  {",
        `    files: ${jsArray(jsxGlobs(rule.appliesTo))},`,
        ...(ignores.length ? [`    ignores: ${jsArray(ignores)},`] : []),
        "    rules: {",
        '      "no-restricted-syntax": [',
        `        ${JSON.stringify(severity)},`,
        renderEntry(rule, "        "),
        "      ],",
        "    },",
        "  },",
        "]",
        "",
      ].join("\n"),
    })
  }

  // `replacements` also carries component-level advice ("Checkbox -> ConformCheckbox"),
  // which react/forbid-elements must not see: it forbids JSX element names, and a
  // rule telling people to ban <Checkbox> outright would be nonsense. JSX says
  // which is which — intrinsics are lowercase — so the check is only generated
  // for a rule whose replacements are entirely intrinsic elements.
  const replacements = rule.replacements ?? []
  const forbiddenIntrinsics = replacements.filter((r) => /^[a-z][a-z0-9-]*$/.test(r.element))
  if (replacements.length > 0 && forbiddenIntrinsics.length === replacements.length) {
    checks.push({
      tool: "eslint",
      title: "ESLint — react/forbid-elements",
      description:
        "Reports each element with its own replacement named, rather than one message covering every banned element — worth the extra dependency if your team lives in the editor. Requires eslint-plugin-react.",
      language: "js",
      code: [
        "// Requires eslint-plugin-react registered in your flat config.",
        '"react/forbid-elements": [',
        `  ${JSON.stringify(severity)},`,
        "  {",
        "    forbid: [",
        ...forbiddenIntrinsics.map((replacement) => {
          const use = replacement.use
            .map((t) => `<${t.name}> from ${t.from}${t.when ? ` (${t.when})` : ""}`)
            .join(", or ")
          return `      { element: ${JSON.stringify(replacement.element)}, message: ${JSON.stringify(`Use ${use}.`)} },`
        }),
        "    ],",
        "  },",
        "],",
        "",
      ].join("\n"),
    })
  }

  if (rule.enforcement.grep) {
    checks.push({
      tool: "ripgrep",
      title: "ripgrep — no setup at all",
      description:
        "Finds candidates for review in any repo, linter or not. Coarser than the selector: it reads lines, not syntax, so expect false positives and treat a clean run as weaker evidence than a clean lint run.",
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
  if (judgementCalls.length > 0 && rule.enforcement.selector) {
    checks.push({
      tool: "eslint",
      title: "Claiming an exception that is not a path",
      description: `${judgementCalls.length === 1 ? "One exception on this rule is" : `${judgementCalls.length} exceptions on this rule are`} a judgement call, so ${judgementCalls.length === 1 ? "it" : "they"} cannot be an \`ignores\` glob. Justify it where it happens — the note after \`--\` is what makes the carve-out reviewable instead of invisible.`,
      language: "tsx",
      code: judgementCalls
        .map((exception) =>
          [
            "{/* eslint-disable-next-line no-restricted-syntax --",
            `    ${exception.scope}: ${firstSentence(exception.reason)} */}`,
          ].join("\n"),
        )
        .join("\n\n"),
    })
  }

  return checks
}

/** Baked into `baseUrl` so the generator and the tests agree on the default. */
export { DEFAULT_BASE_URL }
