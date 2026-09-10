/**
 * Where a rule applies, translated into the two dialects that have to agree.
 *
 * A rule record states its scope in globs — `appliesTo`, and the `paths` on its
 * exceptions. Nothing enforces globs directly: a GritQL plugin tests a regex
 * against `$filename`, and the ripgrep review command takes a shell glob. This
 * module is the translation, kept in one place so the two halves of a rule's
 * scope cannot come apart, and separate from `checks.ts` because it is about
 * paths rather than about Biome.
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
 * A path glob as a regex fragment for a GritQL `$filename` guard.
 *
 * `$filename` is the file's *absolute* path and GritQL matches a regex against
 * the whole of it, while a rule record's globs are project-relative. The
 * translation therefore lets any prefix stand in front — `components/ui/**` has
 * to match whatever directory the project is checked out into — but only a whole
 * one: the leading wildcard is `(?:.*\/)?` rather than `.*`, so a glob starting
 * `app/` matches `<root>/app/x.tsx` and not `<root>/myapp/x.tsx`. That mattered
 * little while these guards only ever subtracted paths; it decides where a rule
 * fires now that `appliesTo` is compiled in the same way.
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
  return glob.startsWith("**") ? anchored : `(?:.*/)?${anchored}`
}

/**
 * The file glob a rule's ripgrep check searches, from its own `appliesTo`.
 *
 * Hardcoding `*.{tsx,jsx}` was right while every rule was about JSX, and stops
 * being right the moment one is not: `no-browser-dialogs` applies to any module,
 * and a review command that only read `.tsx` would report a clean run over a
 * repo whose `confirm()` lives in a `.ts` helper. Derived, like the plugin
 * guard, so the two halves of a rule's scope cannot disagree.
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

/**
 * The `$filename` guard that holds a plugin to its record's `appliesTo`.
 *
 * A built-in Biome rule is scoped by the config that switches it on, so
 * `appliesTo` is answered there. A GritQL plugin is loaded globally — `overrides`
 * does not scope plugins — so without this guard the pattern is run against every
 * file the project lints, including the ones the record never claimed. Every
 * plugin rule here is about JSX; asked about a `.ts` file it answers anyway, and
 * the answer is a diagnostic about a file the rule is not about. (This repo's own
 * `scripts/` and `tests/` are the case that found it.)
 *
 * Derived, never written per rule: widening a record's `appliesTo` widens its
 * plugin, and nothing else has to be remembered.
 */
export function appliesToFilenameRegex(rule: RuleMeta): string {
  if (rule.appliesTo.length === 0) {
    throw new Error(
      `Rule "${rule.id}" declares no appliesTo, so its plugin would have no scope to compile`,
    )
  }
  return `(?:${rule.appliesTo.map(globToFilenameRegex).join("|")})`
}
