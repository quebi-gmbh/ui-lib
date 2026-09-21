/**
 * Reads the built HTML the way everything that is not a browser reads it.
 *
 * The site prerenders every route so each page ships complete content for SEO,
 * social and AI readers. "Complete" is not the same as "present": React can put
 * a Suspense boundary's content at the *end* of the document, inside a
 * `<div hidden id="S:n">`, with the fallback left in the content position
 * behind a `<!--$?-->` marker and a `$RC("B:n","S:n")` call to swap the two
 * when the parser reaches it. A browser is unaffected. A reader that does not
 * execute the page finds a skeleton where the gallery belongs, and finds the
 * gallery in a hidden div a long way further down, out of document order.
 *
 * `src/lib/document-shape.ts` is what stops that happening, and its comment is
 * the argument for both of its settings. This is the check that it worked,
 * against the artifact rather than the source, because the artifact is the only
 * place the question is actually answerable — which is also why the check lives
 * here and not in `tests/`: nothing in CI builds the site.
 *
 *   bun run check:prerender            # build/client, the deploy path
 *   bun run check:prerender --dir some/other/build
 *
 * It runs as part of `bun run build`, before the browser step, so a regression
 * in `src/entry.server.tsx` fails the deploy instead of shipping 176 pages of
 * skeleton. `tests/prerender-completeness.test.tsx` is the half that runs in CI
 * and catches the same regression before the merge; this is the one that cannot
 * be fooled.
 */
import { readdir, readFile } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * The three marks React leaves when it defers a boundary, each named by what a
 * non-executing reader sees. They always appear together, but they are reported
 * separately: which one a page has says whether the boundary was still pending
 * when writing started (`readyOption`) or had resolved and was outlined for its
 * size (`progressiveChunkSize`), and those are different mistakes.
 */
const DEFERRED_MARKS = [
  {
    pattern: /<!--\$\?-->/g,
    label: "a pending-boundary marker (`<!--$?-->`) — a fallback is standing in for content",
  },
  {
    pattern: /<div hidden id="S:\d+">/g,
    label: '`<div hidden id="S:n">` — boundary content parked at the end of the document',
  },
  {
    pattern: /\$RC\(/g,
    label: "a `$RC(...)` call — content that only lands if the reader runs scripts",
  },
] as const

function arg(name: string): string | undefined {
  const flag = `--${name}`
  const index = process.argv.indexOf(flag)
  if (index !== -1) return process.argv[index + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const found: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)))
    else if (entry.name.endsWith(".html")) found.push(path)
  }
  return found.sort()
}

const dir = resolve(ROOT, arg("dir") ?? "build/client")

let files: string[]
try {
  files = await htmlFiles(dir)
} catch {
  console.error(
    `check:prerender: no build to check at ${relative(ROOT, dir)}. Run \`react-router build\` first.`,
  )
  process.exit(1)
}

if (files.length === 0) {
  console.error(`check:prerender: ${relative(ROOT, dir)} holds no HTML files.`)
  process.exit(1)
}

const failures: string[] = []
const affected = new Set<string>()
let documents = 0

for (const file of files) {
  const html = await readFile(file, "utf8")
  // Only whole documents. `build/client/api/components/<slug>.html` is a
  // syntax-highlighted `<pre>` fragment written by `generate:api`, not a page:
  // it has no boundaries to defer, and a component whose source happened to
  // contain the characters `$RC(` would fail this check for nothing.
  if (!html.startsWith("<!DOCTYPE html")) continue
  documents += 1
  for (const { pattern, label } of DEFERRED_MARKS) {
    const count = html.match(pattern)?.length ?? 0
    if (count > 0) {
      affected.add(file)
      failures.push(`  ${relative(ROOT, file)}: ${count} × ${label}`)
    }
  }
}

if (failures.length > 0) {
  console.error(
    [
      `check:prerender: ${affected.size} of ${documents} pages defer a boundary.`,
      "",
      "A prerendered page whose content is in a hidden div at the end of the file is",
      "complete only for a reader that executes it, which is the one reader this site",
      "does not prerender for. See src/lib/document-shape.ts — most likely",
      "src/entry.server.tsx no longer passes both of its settings to",
      "renderToPipeableStream.",
      "",
      ...failures,
    ].join("\n"),
  )
  process.exit(1)
}

if (documents === 0) {
  console.error(
    `check:prerender: ${relative(ROOT, dir)} holds ${files.length} HTML files and no whole documents. Nothing was checked.`,
  )
  process.exit(1)
}

console.log(
  `check:prerender: ${documents} pages, every Suspense boundary resolved in place.`,
)
