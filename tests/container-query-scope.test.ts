/**
 * A container query is answered by an *ancestor*, never by the element asking.
 *
 * This is the one rule about container queries that fails silently. Declare
 * `@container/foo` and query `@3xl/foo:` on the same element and nothing errors,
 * nothing warns, and Tailwind emits both classes quite happily — the declaration
 * takes effect and the query is simply never true. The CSS is valid; the
 * condition is unsatisfiable. It has to be: `container-type: inline-size`
 * promises the element's inline size does not depend on its contents, and a box
 * that sized itself from a query about its own size would be circular.
 *
 * `FilterRailLayout` did exactly that for its whole life (task #206). The layout
 * named its own container and then asked that container for `flex-row`, so it
 * stayed a column at every width — while the rail, a *descendant*, resolved its
 * `@3xl/rail-layout:` variants and took the full sidebar treatment: 224px wide,
 * `sticky`, `max-height`, its own scrollbar. A 224px sticky box stacked above a
 * full-width grid with one containing block between them rides down over the
 * cards on scroll and paints on top of them, because it is positioned. The
 * side-by-side shape the component's header argues for at length had never once
 * rendered, and the OG scene had been composed around the stacked layout.
 *
 * **Why a source scan.** happy-dom does not evaluate container queries at all,
 * so a rendering test here would pass against the broken markup — cover, not a
 * guard. The defect is entirely visible in the class list, which is the one
 * place it can be caught without a browser, so that is where this looks.
 */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path))
    // `.generated.ts` files are baked copies of the sources above them; they are
    // untracked build output, and linting them would report every hit twice.
    else if (/\.tsx$/.test(entry)) out.push(path)
  }
  return out
}

/**
 * The text of every `className` value in a file, one entry per element.
 *
 * `className="…"` is taken to its closing quote; `className={…}` is balanced to
 * its closing brace, so a whole `cn("a", cond && "b")` call arrives as one
 * string. That grouping is the point — the question is only ever asked of a
 * single element's classes.
 */
function classNameValues(source: string): string[] {
  const values: string[] = []
  for (const attr of source.matchAll(/className=/g)) {
    const open = (attr.index ?? 0) + attr[0].length
    if (source[open] === '"') {
      const end = source.indexOf('"', open + 1)
      if (end > 0) values.push(source.slice(open + 1, end))
    } else if (source[open] === "{") {
      let depth = 0
      let i = open
      for (; i < source.length; i++) {
        if (source[i] === "{") depth += 1
        else if (source[i] === "}") {
          depth -= 1
          if (depth === 0) break
        }
      }
      values.push(source.slice(open, i + 1))
    }
  }
  return values
}

/** Container names an element both declares and asks a question of. */
function selfQueriedNames(className: string): string[] {
  const declared = new Set([...className.matchAll(/@container\/([a-z0-9-]+)/g)].map((m) => m[1]))
  const queried = new Set([...className.matchAll(/@[a-z0-9]+\/([a-z0-9-]+):/g)].map((m) => m[1]))
  return [...declared].filter((name) => queried.has(name))
}

describe("no element asks a question of the container it declares", () => {
  test("across every component, route, scene and fixture", () => {
    const offenders: string[] = []
    for (const file of sourceFiles(join(root, "src"))) {
      const source = readFileSync(file, "utf8")
      for (const value of classNameValues(source)) {
        for (const name of selfQueriedNames(value)) {
          offenders.push(`${relative(root, file)} — declares and queries '${name}'`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test("the scan recognises the shape it is looking for", () => {
    // Without this, a regex that stopped matching anything would read as a pass.
    expect(selfQueriedNames("@container/rail-layout flex @3xl/rail-layout:flex-row")).toEqual([
      "rail-layout",
    ])
    // A container declared here and queried by a *descendant* is the correct
    // shape, and must not be reported.
    expect(selfQueriedNames("@container/rail-layout w-full")).toEqual([])
    expect(selfQueriedNames("@3xl/rail-layout:flex-row")).toEqual([])
    // An unnamed container and a plain variant never collide.
    expect(selfQueriedNames("@container flex @sm:grid-cols-2")).toEqual([])
  })

  test("it reads a whole cn() call as one element's classes", () => {
    const value = classNameValues(
      `<div className={cn("@container/x flex", "@3xl/x:flex-row", className)}>`,
    )
    expect(value).toHaveLength(1)
    expect(selfQueriedNames(value[0])).toEqual(["x"])
  })
})
