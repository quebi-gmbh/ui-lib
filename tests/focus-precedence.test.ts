/**
 * Hover must never outrank focus.
 *
 * `Input` shipped `enabled:hover:border-quebi-line/40` next to
 * `focus:border-quebi-brand`. Both set the same property, so exactly one of
 * them applies to a field that is focused *and* under the pointer — and it was
 * the hover one, because `enabled:hover:` compiles to `.cls:enabled:hover`
 * (specificity 0,3,0) against `focus:`'s `.cls:focus` (0,2,0). The focused
 * field therefore dropped back to the grey hairline the moment the mouse
 * arrived, while the mint `focus:ring-2` stayed: a ring with nothing under it,
 * floating a pixel off the field. That is what was reported as the focus glow
 * being too much (task #110), and it was a cascade bug rather than a tuning
 * problem.
 *
 * Nothing in the class string shows you which one wins, which is why this is a
 * test and not a comment. Two halves, and either alone still lets it back in:
 * the precedence facts the guard depends on have to keep holding in the
 * Tailwind version we build with, and no component may write the unguarded
 * shape again.
 */
import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { compile } from "tailwindcss"

const ROOT = join(import.meta.dir, "..")
const COMPONENTS = join(ROOT, "src", "components")

/**
 * Compile utilities through the real pipeline — the quebi theme for the colour
 * tokens, and `tailwindcss-react-aria-components` because it *redefines* the
 * native state variants. Under that plugin `hover:` is not `:hover` but
 * `:is(:where([data-rac])[data-hovered], :where(:not([data-rac])):hover)`, and
 * a react-aria `Input` carries `data-rac`, so the attribute branch is the one
 * that fires. Compiling without the plugin would assert against selectors the
 * site never serves.
 */
let pipeline: Promise<{ build(candidates: string[]): string }> | undefined

function tailwind() {
  pipeline ??= compile(
    [
      `@import "tailwindcss";`,
      `@import "${join(ROOT, "src", "quebi-theme.css")}";`,
      `@plugin "tailwindcss-react-aria-components";`,
    ].join("\n"),
    {
      base: ROOT,
      loadStylesheet: async (id, base) => {
        const path =
          id === "tailwindcss" ? resolve(ROOT, "node_modules/tailwindcss/index.css") : resolve(base, id)
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

async function selectorFor(candidates: string[]): Promise<Record<string, string>> {
  return resolveSelectors((await tailwind()).build(candidates), candidates)
}

/**
 * Flatten the generated CSS to one selector per rule.
 *
 * Tailwind emits a multi-variant utility as *nested* CSS — `.cls { &:enabled {
 * &:not(…) { @media … { &:is(…) { … } } } } }` — so the selector that decides
 * whether the rule applies is the concatenation of the whole chain, and no
 * single line of the output contains it. Splicing the `&` levels together is
 * what turns the sheet back into something `Element.matches` can be asked
 * about; at-rules contribute nothing to the selector and just carry the
 * current one down.
 */
function flattenedSelectors(css: string): string[] {
  const found: string[] = []
  const stack: string[] = []
  for (const raw of css.split("\n")) {
    const line = raw.trim()
    if (line.endsWith("{")) {
      const head = line.slice(0, -1).trim()
      const current = stack.at(-1) ?? ""
      const selector = head.startsWith("@")
        ? current
        : head.startsWith("&")
          ? current + head.slice(1)
          : head
      stack.push(selector)
      if (!head.startsWith("@")) found.push(selector)
    } else if (line === "}") {
      stack.pop()
    }
  }
  return found
}

function resolveSelectors(css: string, candidates: string[]): Record<string, string> {
  const selectors = flattenedSelectors(css)
  return Object.fromEntries(
    candidates.map((candidate) => {
      const escaped = candidate.replace(/[:/[\].]/g, (char) => `\\${char}`)
      // The deepest rule for this class is the fully-qualified one; the shallower
      // entries are the `.cls {` wrappers on the way down.
      const matches = selectors.filter((selector) => selector.startsWith(`.${escaped}`))
      const selector = matches.sort((a, b) => b.length - a.length)[0]
      // No match means the utility did not compile at all — a typo in a guard
      // would otherwise pass every assertion below by matching nothing.
      expect({ candidate, selector }).not.toMatchObject({ selector: undefined })
      return [candidate, selector]
    }),
  )
}

/**
 * A react-aria field carrying `utilities` and in the given state.
 *
 * react-aria mirrors interaction state onto data attributes — the report that
 * opened task #110 quoted exactly this element with `data-focused="true"` and
 * `data-hovered="true"` — and the plugin's variants select on those, so the
 * state is set rather than simulated.
 */
function field(utilities: string[], state: Record<string, string>): HTMLInputElement {
  const input = document.createElement("input")
  input.className = utilities.join(" ")
  input.setAttribute("data-rac", "")
  for (const [name, value] of Object.entries(state)) input.setAttribute(name, value)
  // Deliberately never attached to `document.body`: `matches` only walks the
  // element's own ancestors, and a stray node left in the body outlives the
  // RTL `cleanup` that every other suite relies on.
  return input
}

/**
 * happy-dom does not implement `:enabled` — it answers `false` for an `<input>`
 * that has no `disabled` attribute. Every element under test here is such an
 * input, so dropping the pseudo asks the same question of a matcher that can
 * answer it. Nothing else in these selectors is normalised.
 */
function matchable(selector: string): string {
  return selector.replaceAll(":enabled", "")
}

describe("hover cannot apply to a focused field", () => {
  const GUARDED = "enabled:not-focus:hover:border-quebi-line/40"
  const UNGUARDED = "enabled:hover:border-quebi-line/40"
  const FOCUS_BORDER = "focus:border-quebi-brand"
  const FOCUSED_AND_HOVERED = { "data-focused": "true", "data-hovered": "true" }

  test("the shape that shipped applies to a focused, hovered field", async () => {
    const rules = await selectorFor([UNGUARDED, FOCUS_BORDER])
    const input = field([UNGUARDED, FOCUS_BORDER], FOCUSED_AND_HOVERED)

    // Both rules match the same element, so which border colour the field gets
    // is settled by specificity — and the hover rule is `.cls:enabled:is(…)`
    // against the focus rule's `.cls:is(…)`, (0,3,0) to (0,2,0). Hover won: the
    // mint border went away and the mint ring stayed, floating off the field.
    expect(input.matches(matchable(rules[UNGUARDED]))).toBe(true)
    expect(input.matches(matchable(rules[FOCUS_BORDER]))).toBe(true)
  })

  test("the guard takes hover out of the cascade rather than outranking it", async () => {
    const rules = await selectorFor([GUARDED, FOCUS_BORDER])
    const input = field([GUARDED, FOCUS_BORDER], FOCUSED_AND_HOVERED)

    // Not "focus wins the tie" — there is no tie. The hover rule stops matching
    // the element, so no later change to specificity or variant ordering can
    // revive the bug.
    expect(input.matches(matchable(rules[GUARDED]))).toBe(false)
    expect(input.matches(matchable(rules[FOCUS_BORDER]))).toBe(true)
  })

  test("the guard leaves ordinary hover alone", async () => {
    const selector = matchable((await selectorFor([GUARDED]))[GUARDED])
    expect(field([GUARDED], { "data-hovered": "true" }).matches(selector)).toBe(true)
    expect(field([GUARDED], {}).matches(selector)).toBe(false)
  })

  test("the same holds for focus-within", async () => {
    const within = "not-focus-within:hover:border-quebi-line/40"
    const selector = matchable((await selectorFor([within]))[within])

    const inside = field([within], { "data-focus-within": "true", "data-hovered": "true" })
    expect(inside.matches(selector)).toBe(false)
    expect(field([within], { "data-hovered": "true" }).matches(selector)).toBe(true)
  })

  test("and for the open state, which Select's trigger holds the brand border in", async () => {
    const open = "not-group-open/select:hover:border-quebi-line/40"
    const { [open]: selector } = await selectorFor([open])

    // Asserted on the selector rather than through `matches`: happy-dom cannot
    // evaluate a descendant combinator nested inside `:is()` — it answers
    // `false` for `:is(.group\\/select *)` on an element that is one — and every
    // `group-*` variant compiles to exactly that shape. A browser has no such
    // gap; the source scan below is what actually keeps this one honest.
    expect(selector).toContain(":not(*:is(:where(.group\\/select)")
    expect(selector).toContain("[data-open]")
  })

})

/** Every `cn(` call in a source file, paren-matched. One call is one class list. */
function classLists(source: string): string[] {
  const lists: string[] = []
  for (let i = source.indexOf("cn("); i !== -1; i = source.indexOf("cn(", i + 1)) {
    let depth = 0
    for (let j = i + 2; j < source.length; j++) {
      if ("{[(".includes(source[j])) depth++
      else if ("}])".includes(source[j]) && --depth === 0) {
        lists.push(source.slice(i, j + 1))
        break
      }
    }
  }
  return lists
}

/** Utilities setting `border-*` or `ring-*` under at least one variant. */
const STYLED = /(?:^|[\s"'`])((?:[a-z0-9-]+(?:\/[a-z0-9-]+)?:)+(?:border|ring)-[^\s"'`]+)/g

/** The variant segments of a utility — everything before the property. */
function variants(utility: string): string[] {
  return utility.split(":").slice(0, -1)
}

/**
 * The state a variant segment selects on, with the `group-` wrapper and the
 * `/name` suffix stripped: `group-open/select` → `open`, `focus-within` →
 * `focus-within`. `null` for anything that is not a focus-ish state.
 */
function focusState(segment: string): string | null {
  const bare = segment.replace(/\/[a-z0-9-]+$/, "").replace(/^group-/, "")
  return bare === "focus" || bare === "focus-within" || bare === "open" ? bare : null
}

/** Does this segment negate `state`? Both `not-group-open` and `group-not-open` do. */
function negates(segment: string, state: string): boolean {
  const bare = segment.replace(/\/[a-z0-9-]+$/, "")
  return bare === `not-${state}` || bare === `not-group-${state}` || bare === `group-not-${state}`
}

describe("no component lets hover outrank focus", () => {
  const files = readdirSync(COMPONENTS).filter((file) => file.endsWith(".tsx"))

  test.each(files)("%s", (file) => {
    const source = readFileSync(join(COMPONENTS, file), "utf8")
    const unguarded: { utility: string; state: string }[] = []
    for (const list of classLists(source)) {
      const utilities = [...list.matchAll(STYLED)].map((match) => match[1])
      const hovers = utilities.filter((utility) =>
        variants(utility).some((segment) => /^(group-)?hover(\/[a-z0-9-]+)?$/.test(segment)),
      )
      if (hovers.length === 0) continue

      // Every focus-ish state that some *other* utility in this list paints the
      // same property under. Those are the ones hover can steal.
      const states = new Set(
        utilities
          .filter((utility) => !hovers.includes(utility))
          .flatMap(variants)
          .map(focusState)
          .filter((state): state is string => state !== null),
      )

      for (const hover of hovers) {
        for (const state of states) {
          if (variants(hover).some((segment) => negates(segment, state))) continue
          unguarded.push({ utility: hover, state })
        }
      }
    }

    // A hover utility sharing a property with a focus state has to say so:
    // otherwise which one applies to a focused, hovered control is decided by
    // specificity and Tailwind's emission order, neither of which is visible
    // from the class string. Add the matching `not-<state>` to the hover
    // utility named below.
    expect(unguarded).toEqual([])
  })
})
