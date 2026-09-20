/**
 * The page scroller is the platform's, and nothing may take it over.
 *
 * For most of this repo's life `root.tsx` mounted an OverlayScrollbars
 * instance on `document.body`. That is a supported thing to do and it looked
 * right, but initialising there makes `<html>` the scroll host and gives it
 * `position: relative` — and react-aria's `calculatePosition` special-cases
 * `HTML`/`BODY` *by tag name*, measuring the visual viewport even once it has
 * detected the container is positioned. Every overlay that flips above its
 * trigger therefore got a viewport-relative `bottom:` which the browser
 * resolved against the full document box, and landed
 * `documentHeight − viewportHeight` too low: a tooltip 1285px under the fold
 * on `/components/tooltip` (task #180), a popover 1360px under it on
 * `/components/popover`, 4841px on `/components/month-view` (task #181).
 * Select, ComboBox, Menu, MultipleSelect and DatePicker all shared it.
 *
 * **Why this test and not a browser one.** The honest assertion is "`<html>`
 * is never given a non-static `position`", and it cannot live here: happy-dom
 * has no layout, and the OverlayScrollbars chunk is behind an
 * IntersectionObserver and an idle callback that a test DOM never fires. The
 * assertion would pass because nothing ever ran — a guard that cannot fail,
 * which is worse than no guard at all, because it reads like cover. So this
 * test names the *cause* instead of the symptom. The cause is a single, greppable
 * shape: an OverlayScrollbars whose target is the document. It is the one
 * thing a future reader might reasonably re-add — the overlay bar is prettier
 * and takes no layout width — and the damage it does is nowhere near it.
 */
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "bun:test"

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src")

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

/**
 * Comments in this repo carry the argument, so they say `document.body` and
 * `data-overlayscrollbars-initialize` on purpose — including the one in
 * `root.tsx` explaining why neither appears in the code below it. Reading the
 * code means reading past them.
 */
const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join("\n")

describe("nothing initialises OverlayScrollbars on the document", () => {
  const files = sourceFiles(SRC).map((path) => ({
    name: relative(SRC, path),
    code: code(readFileSync(path, "utf8")),
  }))

  test("no instance targets `document.body` or `document.documentElement`", () => {
    const offenders = files
      .filter(({ code }) => /target:\s*document\.(body|documentElement)/.test(code))
      .map(({ name }) => name)
    expect(offenders).toEqual([])
  })

  test("nobody opts back in with `cancel: { body: false }`", () => {
    // OverlayScrollbars refuses the body by default; that option is the switch
    // that overrides the refusal, so it is the bug's signature even if the
    // target is reached through a variable this test cannot follow.
    const offenders = files
      .filter(({ code }) => /cancel:\s*\{[^}]*body:\s*false/.test(code))
      .map(({ name }) => name)
    expect(offenders).toEqual([])
  })
})

describe("the page scroller is native, and painted like the rest", () => {
  const root = code(readFileSync(join(SRC, "root.tsx"), "utf8"))
  const html = root.slice(root.indexOf("<html"), root.indexOf("<head"))

  test("`<html>` and `<body>` do not hide the native bar for an upgrade that never comes", () => {
    // This attribute is OverlayScrollbars' pre-init state: it hides the native
    // scrollbar while the instance is on its way. With no instance coming, it
    // would leave the page with no visible scrollbar at all.
    expect(root).not.toContain("data-overlayscrollbars-initialize")
  })

  test("`<html>` wears `quebi-scrollbar`, so the page bar matches every other one", () => {
    expect(html).toContain("quebi-scrollbar")
  })

  test("`<html>` reserves the gutter, so a short page and a long one agree", () => {
    // The native bar costs 12px of layout that the overlay bar did not. Without
    // `stable` that width appears and disappears with the page's length, and
    // centred content shifts as you navigate.
    expect(html).toContain("[scrollbar-gutter:stable]")
  })
})
