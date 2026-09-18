/**
 * Where a rule applies, translated into the dialects that have to agree.
 *
 * A rule record states its scope in globs — `appliesTo`, and the `paths` on its
 * exceptions. Biome reads those globs as they are written: a built-in rule is
 * switched on by a config whose `overrides` name them, and a GritQL plugin is
 * loaded by an `overrides` entry that names them too. Only the ripgrep review
 * command speaks a different dialect, so that one is derived here.
 *
 * ## Why there is no glob→regex compiler here any more
 *
 * A plugin's scope used to be a `$filename` guard compiled into the pattern,
 * because `overrides` was believed unable to scope a plugin. `$filename` is
 * **absolute** and the compiled guard was **unanchored**, so a directory *above*
 * the checkout could satisfy a project-relative glob. Both halves of a rule's
 * scope were compiled that way, and both broke:
 *
 *  - `appliesTo: src/**` matched a tree checked out under `~/src/…`, in full —
 *    `tests/**` included — so rules fired on files no record claimed;
 *  - an exception `not $filename <: …src/components/…` matched *every* file in a
 *    tree checked out under a path containing `src/components/`, switching the
 *    rule off for the whole repo. That half points at green: nothing reports,
 *    and a test asserting `bun run lint` is clean passes.
 *
 * Neither is fixable in the regex, because an absolute path does not say where
 * the project root is. What Biome cannot do is *subtract* a plugin in an
 * override (`plugins: []` does not unload one); adding is what scoping needs,
 * and adding has always worked. So the plugin's include list is the record's own
 * globs, matched by Biome against the project root, and the compiler is gone.
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

/** A Biome `includes` pattern that subtracts a path from the ones before it. */
function negated(glob: string): string {
  return `!${glob}`
}

/**
 * The `includes` for the `overrides` entry that loads one plugin rule.
 *
 * This list *is* the plugin's scope, and it is the only statement of it: Biome
 * loads a plugin for the files an override matches and has no way to unload one,
 * so the paths a rule applies to and the paths it excepts have to arrive as a
 * single include list — the record's `appliesTo` first, everything it carves
 * back out negated behind it.
 *
 * Every glob here is the record's own, handed to Biome unchanged. Widening an
 * `appliesTo` widens the plugin, and there is no second dialect that can drift
 * away from it.
 *
 * `extraIgnores` is for a project switching the rule off somewhere for reasons
 * of its own — `localScopes` in `scripts/generate-lint-config.ts` is this repo's.
 */
export function pluginScopeIncludes(rule: RuleMeta, extraIgnores: string[] = []): string[] {
  if (rule.appliesTo.length === 0) {
    throw new Error(
      `Rule "${rule.id}" declares no appliesTo, so its plugin would be loaded for no file at all`,
    )
  }
  return [...rule.appliesTo, ...exceptionPaths(rule).map(negated), ...extraIgnores.map(negated)]
}

/**
 * The file glob a rule's ripgrep check searches, from its own `appliesTo`.
 *
 * Hardcoding `*.{tsx,jsx}` was right while every rule was about JSX, and stops
 * being right the moment one is not: `no-browser-dialogs` applies to any module,
 * and a review command that only read `.tsx` would report a clean run over a
 * repo whose `confirm()` lives in a `.ts` helper. Derived, like the plugin's
 * include list, so the two halves of a rule's scope cannot disagree.
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
