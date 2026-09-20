/**
 * The two ways to reach a component's examples must agree.
 *
 * `src/registry/index.ts` imports all 154 `*.examples.tsx` files statically and
 * zips them against `metaRegistry`; `src/registry/examples-lazy.ts` reaches the
 * same files one at a time through `import.meta.glob`, so that a component page
 * ships its own examples instead of all of them (task #171). Two lists of the
 * same thing is exactly the shape that drifts, and neither the type system nor
 * the build would notice: a slug missing from the glob renders an empty gallery
 * on a page that still prerenders successfully.
 *
 * The lazy module cannot be imported here — `import.meta.glob` is a Vite
 * construct and `bun test` does not resolve it — so these tests read the
 * registry directory the way the glob does and assert the invariants the glob
 * relies on.
 */
import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { registry } from "../src/registry"

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "registry")

const exampleFiles = readdirSync(REGISTRY_DIR).filter((f) => f.endsWith(".examples.tsx"))
const slugsOnDisk = exampleFiles.map((f) => f.slice(0, -".examples.tsx".length)).sort()

describe("the lazy example glob", () => {
  test("every slug the eager registry has examples for has a file the glob matches", () => {
    const eager = registry.filter((c) => c.examples.length > 0).map((c) => c.slug)
    const missing = eager.filter((slug) => !slugsOnDisk.includes(slug))
    expect(missing).toEqual([])
  })

  /**
   * Five files carry the `.examples.tsx` suffix without being a component's
   * gallery: `table-fixtures` (shared fixture data) and the four
   * `data-table-*` partials that `data-table.examples.tsx` composes. The glob
   * matches them, and nothing ever asks for them by slug — but they are why
   * "the first array export" would be the wrong rule for `loadExamples`, and
   * why a `*.examples.tsx` file is not by itself evidence of a component.
   *
   * Asserted as "reachable from a real gallery" rather than as a hardcoded
   * list, so splitting another gallery into partials needs no edit here and
   * an orphaned file still fails.
   */
  test("an example file whose slug is not a component is imported by one that is", () => {
    const known = new Set(registry.map((c) => c.slug))
    const strays = slugsOnDisk.filter((slug) => !known.has(slug))
    const galleries = exampleFiles
      .filter((f) => known.has(f.slice(0, -".examples.tsx".length)))
      .map((f) => readFileSync(join(REGISTRY_DIR, f), "utf8"))
    const orphans = strays.filter(
      (slug) => !galleries.some((src) => src.includes(`"./${slug}.examples"`)),
    )
    expect(orphans).toEqual([])
  })

  test("each component's example file has exactly one `...Examples` array export", async () => {
    const known = new Set(registry.map((c) => c.slug))
    const offenders: string[] = []
    for (const file of exampleFiles) {
      const slug = file.slice(0, -".examples.tsx".length)
      if (!known.has(slug)) continue
      const mod: Record<string, unknown> = await import(join(REGISTRY_DIR, file))
      const named = Object.entries(mod).filter(
        ([name, v]) => name.endsWith("Examples") && Array.isArray(v),
      )
      if (named.length !== 1) offenders.push(`${file}: ${named.length} \`...Examples\` arrays`)
    }
    expect(offenders).toEqual([])
  })

  test("the fixtures file has no `...Examples` export, so it can never be picked", async () => {
    const mod: Record<string, unknown> = await import(
      join(REGISTRY_DIR, "table-fixtures.examples.tsx")
    )
    expect(Object.keys(mod).filter((n) => n.endsWith("Examples"))).toEqual([])
  })
})
