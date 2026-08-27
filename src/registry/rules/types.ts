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
 * How a rule is (or will be) checked.
 * - `lint`       — expressible as a static check; `selector` carries the AST selector.
 * - `types`      — the type system already rejects it.
 * - `convention` — human/agent review only.
 */
export type RuleEnforcementKind = "lint" | "types" | "convention"

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
  /** Path or glob the carve-out covers. */
  scope: string
  reason: string
}

export interface RuleEnforcement {
  kind: RuleEnforcementKind
  /**
   * ESLint/oxlint (esquery) selector for a `no-restricted-syntax`-style check.
   * Nothing consumes it yet — this repo has no lint infrastructure. It is
   * recorded now so the lint config can later be *generated* from these records
   * and the documented rule cannot drift from the enforced one.
   */
  selector?: string
  /** What is true today about enforcement. */
  note?: string
}

/** Human-curated metadata for a single rule. */
export interface RuleMeta {
  /** kebab-case id; also the `/rules/<id>` slug and the api/rules/<id>.json name. */
  id: string
  title: string
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
