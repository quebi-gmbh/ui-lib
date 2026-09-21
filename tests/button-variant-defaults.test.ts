/**
 * A `Button` that is styled by className alone still takes the defaults.
 *
 * `buttonStyles` defaults to `intent: "primary"`, `size: "md"`. A call site
 * that passes only a `className` is therefore not "an unstyled button plus my
 * classes" — it is the mint CTA with some classes merged over it, and the
 * merge is partial by construction: tailwind-merge collapses two classes only
 * when it can put them in one group. `size-4` beats `size-*`, and `px-5 py-2.5`
 * is a *different* group, so it survives untouched.
 *
 * That is exactly what happened to `TableFilterChips` (task #187): a 16px box
 * with 20px of padding a side left the content box at zero width, so the ×
 * measured 0×12 inside a solid mint blob, on every consumer of `DataTable` and
 * `ServerTable`. It is the same shape as task #142 in `ShowMore`.
 *
 * So: if a className moves the box, name the `size`; if it paints a fill, name
 * the `intent`. Layout and per-call colour tweaks (`w-full`, a hover tint) are
 * still the call site's, and cost nothing here — these two families are the
 * ones the variants already own, and they are the two the defaults supply
 * silently.
 */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(import.meta.dir, "..")

/** Padding and `size-*`: what a `size` variant sets, minus what it does not. */
const BOX = /(^|[\s"'`:])(size|p|px|py|ps|pe|pt|pb|pl|pr)-/
/** A fill: what an `intent` sets. A text colour alone is a tint, not a fill. */
const INK = /(^|[\s"'`:])bg-/

/** Every `.tsx` under `src/` and `tests/`, minus the generated source dumps. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => !path.includes(join("registry", "sources")))
}

/** The opening tag of every `<Name …>`, brace- and string-aware. */
function openingTags(source: string, name: string): { attrs: string; line: number }[] {
  const tags: { attrs: string; line: number }[] = []
  const re = new RegExp(`<${name}(?=[\\s/>])`, "g")
  for (let m = re.exec(source); m !== null; m = re.exec(source)) {
    const start = m.index + name.length + 1
    let depth = 0
    let quote: string | null = null
    let i = start
    for (; i < source.length; i++) {
      const c = source[i]
      if (quote) {
        if (c === "\\") i++
        else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'" || c === "`") quote = c
      else if (c === "{") depth++
      else if (c === "}") depth--
      else if (c === ">" && depth === 0) break
    }
    tags.push({ attrs: source.slice(start, i), line: source.slice(0, m.index).split("\n").length })
  }
  return tags
}

/** What the call site does wrong, if anything. Empty means it is fine. */
function unnamedVariants(attrs: string): string[] {
  const className = /className\s*=\s*("([^"]*)"|\{([\s\S]*)\})/.exec(attrs)
  if (!className) return []
  const classes = className[2] ?? className[3] ?? ""
  const missing: string[] = []
  if (BOX.test(classes) && !/(^|\s)size\s*=/.test(attrs)) missing.push("size")
  if (INK.test(classes) && !/(^|\s)intent\s*=/.test(attrs)) missing.push("intent")
  return missing
}

describe("a className that overrides a variant says which variant it means", () => {
  const files = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "tests"))]

  test("every call site in src/ and tests/", () => {
    const offenders = files.flatMap((file) => {
      const source = readFileSync(file, "utf8")
      const names = [
        /import\s*\{[^}]*\bButton\b[^}]*\}\s*from\s*"@\/components\/button"/.test(source) &&
          "Button",
        /import\s*\{[^}]*\bLinkButton\b[^}]*\}\s*from\s*"@\/components\/link-button"/.test(
          source,
        ) && "LinkButton",
      ].filter((name): name is string => Boolean(name))

      return names.flatMap((name) =>
        openingTags(source, name)
          .map((tag) => ({ ...tag, missing: unnamedVariants(tag.attrs) }))
          .filter((tag) => tag.missing.length > 0)
          .map(
            (tag) =>
              `${file.slice(ROOT.length + 1)}:${tag.line} — <${name}> restyles what ` +
              `${tag.missing.join(" and ")} owns without naming ${tag.missing.length > 1 ? "them" : "it"}`,
          ),
      )
    })
    expect(offenders).toEqual([])
  })

  /**
   * The scanner has to still see the bug it was written for, or the suite above
   * passes because nothing matches rather than because nothing is wrong. This
   * is `TableFilterChips` as it shipped.
   */
  test("catches the shape it was written for", () => {
    const shipped = `
      <Button
        aria-label={\`Clear \${filter.label} filter\`}
        onPress={() => onClear(filter.column)}
        className="flex size-4 shrink-0 items-center justify-center rounded-full text-quebi-brand-text/80 outline-none transition-colors hover:bg-quebi-brand/20 hover:text-quebi-brand-text focus-visible:ring-2 focus-visible:ring-quebi-brand-mark"
      >`
    const [tag] = openingTags(shipped, "Button")
    expect(unnamedVariants(tag.attrs)).toEqual(["size", "intent"])
  })
})
