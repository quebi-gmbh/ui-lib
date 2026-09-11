/**
 * The shape of the dependency graph a consumer downloads.
 *
 * `npx shadcn add <slug>` resolves `registryDependencies` transitively, so an
 * edge in this graph is a decision about what lands in someone else's project,
 * not an implementation detail. The generated JSON that carries those edges is
 * a build output and gitignored, so the assertions here run the generator's own
 * `registryDependenciesFor` over the committed sources instead — the same
 * function `emitComponents` writes into the JSON, on purpose: a test against a
 * second copy of the logic would go on passing while the published file said
 * something else.
 *
 * The named case is the table family. `async-table` used to list `data-table`,
 * because the chrome both tables share happened to live in the client table's
 * file — so adding a server-driven table pulled a 2,400-line client table,
 * TanStack's client row models and eight conform variants in behind it, to
 * render a table that uses none of them. The split that fixed it is only as
 * durable as something that notices it reversing.
 */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { registryDependenciesFor } from "../scripts/api/components"
import { metaRegistry } from "../src/registry/meta"

const COMPONENTS_DIR = join(import.meta.dir, "..", "src", "components")
const slugs = new Set(metaRegistry.map((meta) => meta.slug))

/** slug -> the registry dependencies its source implies (components and libs). */
const graph = new Map<string, string[]>(
  readdirSync(COMPONENTS_DIR)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => [
      file.replace(/\.tsx$/, ""),
      registryDependenciesFor(readFileSync(join(COMPONENTS_DIR, file), "utf8"), slugs),
    ]),
)

/** Every slug reachable from `slug`, which is what `shadcn add` will fetch. */
function closure(slug: string): Set<string> {
  const seen = new Set<string>()
  const queue = [...(graph.get(slug) ?? [])]
  while (queue.length > 0) {
    const next = queue.pop()
    if (!next || seen.has(next)) continue
    seen.add(next)
    queue.push(...(graph.get(next) ?? []))
  }
  return seen
}

describe("the table family's dependency arrows", () => {
  test("the server-driven table does not depend on the client one", () => {
    // The acceptance criterion of the five-slug split, stated where it can fail.
    expect(graph.get("server-table")).not.toContain("data-table")
    expect([...closure("server-table")]).not.toContain("data-table")
  })

  test("shell and controls are siblings — neither imports the other", () => {
    // The seam that keeps the family a tree. The shell renders a filter popover
    // from a `renderFilter(columnId)` prop and the mode components are what pass
    // a <TableFilterPanel> into it; an import either way would close the loop.
    expect(graph.get("table-shell")).not.toContain("table-controls")
    expect(graph.get("table-controls")).not.toContain("table-shell")
  })

  test("neither shared part depends on a mode", () => {
    for (const part of ["table-shell", "table-controls"]) {
      expect(graph.get(part)).not.toContain("data-table")
      expect(graph.get(part)).not.toContain("server-table")
    }
  })

  test("both modes are assembled from both shared parts", () => {
    for (const mode of ["data-table", "server-table"]) {
      expect(graph.get(mode)).toContain("table-shell")
      expect(graph.get(mode)).toContain("table-controls")
      // The column vocabulary, the selection model and the query shape.
      expect(graph.get(mode)).toContain("lib-data-table")
    }
  })

  test("only the shell renders a table, and the plain Table is nobody's dependent", () => {
    expect(graph.get("table-shell")).toContain("table")
    expect(graph.get("table")).not.toContain("table-shell")
  })
})

describe("what counts as an edge", () => {
  test("a re-export is a dependency, even with no import beside it", () => {
    // `export { X } from "@/components/sibling"` is an edge that looks like
    // nothing: the sibling's name never appears in an import statement, and a
    // component shipped without it in registryDependencies lands in a
    // consumer's project with a dangling import. table-shell has one of these
    // today, alongside a normal import of the same module — which is how a gap
    // like this stays invisible until the day the normal import goes away.
    const source = `export { TABLE_BAND_HEIGHT } from "@/components/table"\n`
    expect(registryDependenciesFor(source, slugs)).toEqual(["table"])
  })

  test("a type-only import is a dependency too", () => {
    // The source is copied verbatim into someone's project and compiled there,
    // so an erased import is still a file they need.
    const source = `import type { TableProps } from "@/components/table"\n`
    expect(registryDependenciesFor(source, slugs)).toEqual(["table"])
  })
})

describe("the component graph as a whole", () => {
  test("no component depends on itself, directly or through others", () => {
    // A cycle is unrepresentable in a registry that resolves transitively: it
    // either loops forever or silently truncates, and which one you get is the
    // consumer's tool's business rather than ours.
    for (const slug of graph.keys()) {
      expect([slug, ...closure(slug)].filter((s) => s === slug)).toHaveLength(1)
    }
  })

  test("every component dependency is a published slug", () => {
    for (const [slug, deps] of graph) {
      for (const dep of deps) {
        if (dep.startsWith("lib-")) continue
        expect(slugs, `${slug} depends on ${dep}`).toContain(dep)
      }
    }
  })
})
