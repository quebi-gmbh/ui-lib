/**
 * The overlay animation utilities have to exist.
 *
 * Six components — Modal, Sheet, Popover, Tooltip, Sidebar and CommandMenu —
 * describe their enter and exit motion in class names: `entering:animate-in`,
 * `entering:fade-in`, `entering:slide-in-from-right`, `sm:exiting:zoom-out-95`.
 * That vocabulary is `tailwindcss-animate`'s, and that package has never been a
 * dependency of this repo. Nothing defined the names, so Tailwind generated no
 * rule for any of them and all six overlays appeared and vanished between one
 * frame and the next, from the first commit until task #179.
 *
 * Nothing failed while that was true. The class strings looked exactly like
 * working class strings, `bun run build` was green, and the only way to see it
 * was to open the built stylesheet and notice what was not in it. So that is
 * what this file does — it compiles the real pipeline (the quebi theme plus
 * `tailwindcss-react-aria-components`, which is what registers the `entering:`
 * and `placement-*` variants) and asserts that every animation utility written
 * in `src/` comes out the other end as CSS.
 *
 * It reads the candidates out of the source rather than listing them, which is
 * the half that matters: adding `entering:slide-in-from-top-4` to a component
 * without adding the utility to `src/quebi-theme.css` fails here instead of
 * shipping another silent no-op.
 */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { compile } from "tailwindcss"

const ROOT = join(import.meta.dir, "..")
const SRC = join(ROOT, "src")

/**
 * The same pipeline `tests/focus-precedence.test.ts` compiles against, and for
 * the same reason: the plugin *redefines* the react-aria state variants, so a
 * build without it would resolve `entering:` to something the site never serves
 * — or to nothing at all, which would make this file pass for the wrong reason.
 */
let pipeline: Promise<{ build(candidates: string[]): string }> | undefined

function tailwind() {
  pipeline ??= compile(
    [
      `@import "tailwindcss";`,
      `@import "${join(SRC, "quebi-theme.css")}";`,
      `@plugin "tailwindcss-react-aria-components";`,
    ].join("\n"),
    {
      base: ROOT,
      loadStylesheet: async (id, base) => {
        const path =
          id === "tailwindcss"
            ? resolve(ROOT, "node_modules/tailwindcss/index.css")
            : resolve(base, id)
        return { path, base: dirname(path), content: readFileSync(path, "utf8") }
      },
      loadModule: async (id, base) => {
        const path = id.startsWith(".") ? resolve(base, id) : id
        const loaded = await import(path)
        return { path, base: dirname(path), module: loaded.default ?? loaded }
      },
    },
  )
  return pipeline
}

/** The utility names this theme is responsible for, without their variants. */
const ANIMATION_UTILITY =
  /^(animate-(in|out)|direction-reverse|fade-(in|out)|zoom-(in|out)-\d+|slide-(in-from|out-to)-(top|bottom|left|right)(-\d+)?)$/

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

/**
 * Every class candidate in `src/` whose *final* segment is one of ours.
 *
 * Split on `:` and keep the last part, so `sm:exiting:zoom-out-95` is found by
 * its `zoom-out-95` — and so `cursor-zoom-in`, which contains one of these
 * names but is Tailwind's own, is not mistaken for one.
 */
function usedCandidates(): Map<string, string[]> {
  const found = new Map<string, string[]>()
  for (const file of sourceFiles(SRC)) {
    for (const token of readFileSync(file, "utf8").match(/[\w:/[\].%-]+/g) ?? []) {
      const base = token.split(":").at(-1) ?? ""
      if (!ANIMATION_UTILITY.test(base)) continue
      const where = found.get(token) ?? []
      where.push(file.slice(ROOT.length + 1))
      found.set(token, where)
    }
  }
  return found
}

function selectorFor(css: string, candidate: string): boolean {
  return css.includes(`.${candidate.replace(/[:/[\].%]/g, (char) => `\\${char}`)}`)
}

describe("overlay animation utilities", () => {
  test("every animation class written in src compiles to a rule", async () => {
    const used = usedCandidates()
    // If this is ever empty the assertions below are all vacuous.
    expect(used.size).toBeGreaterThan(20)

    const css = (await tailwind()).build([...used.keys()])
    const dead = [...used.entries()]
      .filter(([candidate]) => !selectorFor(css, candidate))
      .map(([candidate, where]) => `${candidate} (${[...new Set(where)].join(", ")})`)

    expect(dead).toEqual([])
  })

  test("the keyframes ship, and read the properties the utilities set", async () => {
    const css = (await tailwind()).build([...usedCandidates().keys()])

    for (const name of ["quebi-enter", "quebi-exit"]) {
      expect(css).toContain(`@keyframes ${name}`)
    }

    // The utilities set `--quebi-enter-*` / `--quebi-exit-*`; the keyframes read
    // them. Nothing but this connects the two halves, so a rename on one side
    // would otherwise animate from the fallback values — i.e. not at all.
    const keyframes = Object.fromEntries(
      ["enter", "exit"].map((phase) => {
        const start = css.indexOf(`@keyframes quebi-${phase}`)
        return [phase, css.slice(start, css.indexOf("@keyframes", start + 1))]
      }),
    )
    for (const property of css.match(/--quebi-(enter|exit)-[\w-]+/g) ?? []) {
      const phase = property.includes("-enter-") ? "enter" : "exit"
      expect(keyframes[phase]).toContain(property)
    }
  })

  test("duration and easing come from Tailwind's own utilities", async () => {
    // `animate-in` reads `--tw-duration` / `--tw-ease` instead of shipping its
    // own `duration-*` override, which is what makes `entering:duration-300
    // entering:ease-out` on a Modal mean what it looks like it means. Both
    // halves are Tailwind's internals, so pin them: an upgrade that renamed
    // either would leave every overlay on the default 200ms with nothing to say.
    const css = (await tailwind()).build(["animate-in", "animate-out", "duration-300", "ease-out"])

    expect(css).toContain("var(--tw-duration")
    expect(css).toContain("var(--tw-ease")
    expect(css).toMatch(/\.duration-300\s*{[^}]*--tw-duration:\s*300ms/)
    expect(css).toMatch(/\.ease-out\s*{[^}]*--tw-ease:/)
  })

  test("reduced motion turns the animation off rather than shortening it", async () => {
    // react-aria keeps an exiting overlay mounted for as long as
    // `getAnimations()` says it is animating, so "no animation" is a state it
    // already unmounts correctly from — which a near-zero duration would not be.
    const css = (await tailwind()).build(["animate-in", "animate-out"])
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
  })
})
