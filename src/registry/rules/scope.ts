/**
 * Where a rule applies, translated into the two dialects that have to agree.
 *
 * A rule record states its scope in globs — `appliesTo`, and the `paths` on its
 * exceptions. Nothing enforces globs directly: Biome takes them as `includes`
 * on an `overrides` entry, and the ripgrep review command takes a shell glob.
 * This module is the translation, kept in one place so the two halves of a
 * rule's scope cannot come apart, and separate from `checks.ts` because it is
 * about paths rather than about Biome.
 *
 * ## Why this is not a `$filename` regex any more
 *
 * It used to be. A GritQL plugin can guard its pattern with
 * `$filename <: r"..."`, and for as long as `overrides` was believed not to
 * reach plugins that was the only place a plugin's scope could live. The
 * trouble is `$filename` is the file's **absolute** path while a record's globs
 * are project-relative, so the compiled regex had to let any prefix stand in
 * front of the glob — and an unanchored prefix cannot tell the project root
 * from an ancestor directory that happens to share a name with one of its
 * directories. In a checkout under `/home/<user>/src/…`, every `.tsx` file in
 * the repo satisfied `src/**\/*.tsx`: `bun run lint` reported
 * `tests/components/data-table-cells.test.tsx` as app code, and the identical
 * tree copied to `/tmp` was clean. The exception guards were compiled the same
 * way and subtract, so the same accident under a `src/components/` ancestor
 * would have excused the whole repo from the element ban with nothing to say it
 * had (task #93).
 *
 * No regex over the absolute path alone can fix that — "the last `src/` segment"
 * and "the shortest tail" both pick the decoy when the decoy is the only
 * candidate. What fixes it is not needing the absolute path: Biome resolves an
 * `overrides` entry's `includes` against the project root itself, and since
 * 2.5 an entry may carry `plugins`. So a plugin's scope is now an override, the
 * record's globs go to Biome verbatim, and the question the regex could not
 * answer is one Biome answers for us.
 *
 * Note the asymmetry that makes this work: an override **adds** its `plugins` to
 * the files it matches, and cannot subtract a plugin listed in the top-level
 * `plugins` — which is why nothing is listed there. `tests/config.test.ts` pins
 * both halves.
 *
 * Re-exported from `./checks`, which is where everything else imports it from.
 */
import type { RuleMeta } from "./types"

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
 * An extra ignore glob that is not one of the rule's published exceptions.
 *
 * A project may need a plugin rule switched off somewhere its own layout makes
 * unavoidable, without claiming that carve-out is true for every consumer.
 * `reason` is written into the config next to the glob, so a carve-out and the
 * argument for it stay together — the same discipline the published exceptions
 * follow.
 */
export interface ExtraPluginIgnore {
  glob: string
  reason: string
}

/**
 * A record's glob, checked before it is handed to Biome verbatim.
 *
 * Biome matches `includes` against the project-relative path, and reads a
 * leading `!` as "except these". A record whose glob were absolute, or
 * `./`-prefixed, or already negated would therefore either match nothing or
 * inside-out, and an `appliesTo` that matches nothing is a rule that has
 * silently stopped running. The records are all well-formed today; this is here
 * so that a malformed one fails the generator instead of the rule.
 */
function assertRelativeGlob(rule: RuleMeta, glob: string): string {
  if (glob.startsWith("!") || glob.startsWith("/") || glob.startsWith("./") || glob.startsWith("../")) {
    throw new Error(
      `Rule "${rule.id}" declares the scope glob "${glob}", which is not project-relative. Biome resolves an override's includes against the project root, so a glob here reads as a plain relative path — no leading "/", "./", "../" or "!".`,
    )
  }
  return glob
}

/**
 * The `includes` list that holds a plugin to its record's scope.
 *
 * A built-in Biome rule is scoped by the config that switches it on, so
 * `appliesTo` is answered there. A GritQL plugin listed in the top-level
 * `plugins` is run against every file the project lints, including the ones the
 * record never claimed — every plugin rule here is about JSX, and asked about a
 * `.ts` file it answers anyway. Listing it under an `overrides` entry instead
 * gives it the same path scoping the built-ins get: the paths the record applies
 * to, then the paths its exceptions (and any local ones) carve back out, each as
 * a `!` entry.
 *
 * Derived, never written per rule: widening a record's `appliesTo` widens its
 * plugin, and nothing else has to be remembered.
 */
export function scopeIncludes(rule: RuleMeta, extraIgnores: ExtraPluginIgnore[] = []): string[] {
  if (rule.appliesTo.length === 0) {
    throw new Error(
      `Rule "${rule.id}" declares no appliesTo, so its plugin would have no scope to compile`,
    )
  }
  const includes = rule.appliesTo.map((glob) => assertRelativeGlob(rule, glob))
  const ignored = new Set([
    ...exceptionPaths(rule),
    ...extraIgnores.map(({ glob }) => glob),
  ])
  return [...includes, ...[...ignored].map((glob) => `!${assertRelativeGlob(rule, glob)}`)]
}

/**
 * The file glob a rule's ripgrep check searches, from its own `appliesTo`.
 *
 * Hardcoding `*.{tsx,jsx}` was right while every rule was about JSX, and stops
 * being right the moment one is not: `no-browser-dialogs` applies to any module,
 * and a review command that only read `.tsx` would report a clean run over a
 * repo whose `confirm()` lives in a `.ts` helper. Derived, like the plugin
 * scope, so the two halves of a rule's scope cannot disagree.
 */
export function grepGlob(rule: RuleMeta): string {
  const extensions = new Set<string>()
  for (const glob of rule.appliesTo) {
    const braced = glob.match(/\.\{([^}]+)\}$/)
    if (braced) {
      for (const extension of braced[1].split(",")) extensions.add(extension.trim())
      continue
    }
    const dot = glob.lastIndexOf(".")
    if (dot !== -1) extensions.add(glob.slice(dot + 1))
  }
  const sorted = [...extensions].filter(Boolean).sort()
  if (sorted.length === 0) {
    throw new Error(
      `Rule "${rule.id}" declares an appliesTo with no file extension, so its ripgrep check would search everything`,
    )
  }
  return sorted.length === 1 ? `*.${sorted[0]}` : `*.{${sorted.join(",")}}`
}
