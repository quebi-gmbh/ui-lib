/**
 * Rule records — the single source of truth for the /rules route, the generated
 * `api/rules*.json` endpoints, and the rules section of llms.txt / SKILL.md.
 *
 * Plain data, fully serializable (no JSX, no functions) so `scripts/generate-api.ts`
 * can import this registry under bun the same way it imports `meta.ts`.
 */

/** How hard a rule bites. `error` = never do this; `warn` = needs a judgement call. */
export type RuleSeverity = "error" | "warn"

/**
 * How a rule is checked.
 * - `lint`       — Biome checks it; see `RuleEnforcement.biome`.
 * - `types`      — the type system already rejects it.
 * - `convention` — human/agent review only.
 */
export type RuleEnforcementKind = "lint" | "types" | "convention"

/**
 * Which of Biome's two mechanisms carries the rule.
 *
 * `rule` is a built-in Biome rule whose options are derived from the record —
 * nothing is hand-written, so the config cannot describe something the page does
 * not. `plugin` is a GritQL pattern, for the checks Biome has no built-in rule
 * for; the generator wraps it in a plugin file and compiles the rule's
 * documented exceptions into it as `$filename` guards.
 */
export type BiomeEnforcement =
  | {
      via: "rule"
      /** Fully-qualified Biome rule, e.g. "correctness/noRestrictedElements". */
      rule: string
    }
  | {
      via: "plugin"
      /**
       * The GritQL pattern body: everything between `language js;` and the
       * closing brace of the `where` block, minus the filename guards and the
       * register_diagnostic call, which the generator adds. Written against
       * Biome's CST node names (PascalCase, snake_case fields).
       */
      pattern: string
    }

/** A themed set of rules. Rules point at a group through `RuleMeta.category`. */
export interface RuleGroup {
  /** kebab-case id, referenced by `RuleMeta.category`. */
  id: string
  title: string
  /** The one-liner an agent should internalise for this group. */
  principle: string
  description: string
}

/** Something to import instead of the banned intrinsic. */
export interface RuleReplacementTarget {
  /** Exported symbol to import, e.g. "Button". */
  name: string
  /** Import specifier to write, e.g. "@/components/button" or "react-router". */
  from: string
  /**
   * Registry slug when the replacement is a ui-lib component. Validated against
   * the component registry at build time, so a renamed component breaks the
   * build instead of leaving a rule pointing at something that no longer exists.
   */
  slug?: string
  /** Which of several replacements to reach for. */
  when?: string
}

/** "Don't write `<x>`; import one of these instead." */
export interface RuleReplacement {
  /** The intrinsic element being replaced, e.g. "button". */
  element: string
  use: RuleReplacementTarget[]
  note?: string
}

/**
 * A class-*content* allowlist. The gate is what the classes do, not whether the
 * element has any: layout and spacing are the consumer's, appearance is the
 * library's.
 */
export interface RuleClassPolicy {
  /** Class prefixes that are fine on a raw layout element. */
  allowed: string[]
  /** Class prefixes that mean a library component is being reinvented. */
  violating: string[]
  note?: string
}

/** A wrong/right pair. Wrong snippets are real code from this repo wherever possible. */
export interface RuleExample {
  title: string
  /** The violating snippet. */
  wrong: string
  /** The same intent, done right. */
  right: string
  /** Repo-relative origin of the wrong snippet, when it is real code. */
  source?: string
  note?: string
}

/** A carve-out. Every exception needs a reason — an unjustified one is a bug. */
export interface RuleException {
  /** Path or glob the carve-out covers, in prose. */
  scope: string
  reason: string
  /**
   * Machine-readable globs for the same carve-out, when it is expressible as
   * paths. These become `ignores` entries in the generated lint config, which is
   * what stops the generated config from flagging a documented exception. An
   * exception that is a judgement call (not a path) leaves this empty and is
   * handled with an inline disable comment instead.
   */
  paths?: string[]
  /**
   * For an element rule: which elements this carve-out excuses, rather than the
   * whole rule. Without it the rule is switched off entirely in `paths`, which
   * is almost always too broad — a library's own source needs `<input>` for
   * hidden form values, not a licence to hand-roll `<button>`.
   */
  elements?: string[]
}

export interface RuleEnforcement {
  kind: RuleEnforcementKind
  /**
   * How Biome carries the rule. The generated `biome.jsonc` and the `.grit`
   * plugins are built from this, so the documented rule and the enforced rule
   * come from one record and cannot drift. Required when `kind` is "lint".
   */
  biome?: BiomeEnforcement
  /**
   * The message Biome prints. It must say what to use instead — a rule that only
   * names what is forbidden makes the reader go looking for the answer.
   * Required when `kind` is "lint"; the build enforces that.
   */
  message?: string
  /**
   * A ripgrep pattern that finds candidates for this rule with no lint setup at
   * all. Coarser than the Biome check (it reads lines, not syntax), so it is a
   * review aid, not a gate — but it is the only check available to an agent
   * working in a repo with no linter, which is most of them.
   */
  grep?: string
  /** What is true today about enforcement. */
  note?: string
}

/**
 * A runnable check for a rule, derived from its record by
 * `scripts/generate-api.ts` — never hand-written, so a rule and the config that
 * enforces it cannot disagree.
 */
export interface RuleCheck {
  /** Tool the snippet is for, e.g. "biome", "ripgrep". */
  tool: string
  title: string
  /** What this check does and does not catch. */
  description: string
  /** Shiki language id for the snippet. */
  language: "json" | "bash" | "tsx" | "js"
  code: string
}

/** Human-curated metadata for a single rule. */
export interface RuleMeta {
  /** kebab-case id; also the `/rules/<id>` slug and the api/rules/<id>.json name. */
  id: string
  title: string
  /**
   * Two or three words for the sidebar, where the full title does not fit.
   * Falls back to `title` when absent, which will overflow — so keep it short.
   */
  navTitle?: string
  /** One sentence, shown in listings and in llms.txt. Says what to do, not only what not to. */
  summary: string
  severity: RuleSeverity
  /** `RuleGroup.id` this rule belongs to. */
  category: string
  /** Position within the group's tiers, when the group is tiered. */
  tier?: number
  /** Why the rule exists, one paragraph per entry. */
  rationale: string[]
  /** Globs (in a consuming app) the rule applies to. */
  appliesTo: string[]
  examples: RuleExample[]
  replacements?: RuleReplacement[]
  classPolicy?: RuleClassPolicy
  exceptions: RuleException[]
  enforcement: RuleEnforcement
  tags: string[]
}
