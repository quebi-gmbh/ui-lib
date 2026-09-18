/**
 * A hairline is `quebi-line` at an alpha — pinned against regressing to a raw
 * palette scale inside the library source.
 *
 * Task #103 repainted five 1px rules in `src/components/` that were written
 * `bg-cyan-500/10`. That string is not a colour choice; it is the *dark-theme
 * value of `--q-line`* inlined. The token flips to ink under `.light` precisely
 * so a hairline stays visible there, so the inlined copy rendered 1.09:1 on the
 * light surface — a divider that is simply not drawn. `separator.tsx`,
 * `sidebar.tsx`, `dropdown.tsx`, `table.tsx` and `chart.tsx` all had it, and
 * nothing in the repo could say so.
 *
 * Nothing still can. `no-hardcoded-design-values` has exactly the right pattern
 * for `bg-cyan-500/10`, but its first `exceptions` entry excepts
 * `src/components/**` wholesale, and that exception is *right*: the components
 * do resolve palette scales deliberately — a danger state on red-500, a Badge
 * intent on emerald-500, a Skeleton track on `bg-cyan-500/5`. The exception's
 * paths also reach `components/ui/**` in a consumer's checkout, where the
 * vendored source is not theirs to re-token and the message would be firing at
 * someone who cannot act on it. So the exception stays, and this file takes the
 * narrow case it is silently covering.
 *
 * ## Where the line is drawn
 *
 * Not every border in the library is a hairline, and the rule must not fight
 * the ones that are not:
 *
 * - A **mint fill's edge** is `border-quebi-brand-mark` (task #145,
 *   `mark-contrast.test.ts`). A **focus mark** is the same token. Both are
 *   brand, not chrome.
 * - An **intent-tinted container** edges in its intent — `border-red-500/20`,
 *   `border-amber-500/20`, `ring-red-500/50` on an invalid control. Those
 *   colours carry the meaning; re-tokenising them is a separate design
 *   question and this file does not open it.
 * - A **tint, track or scrim** is a fill, not an edge: `bg-cyan-500/5` under a
 *   Skeleton, `bg-cyan-500/10` behind a Meter, `bg-black/60` on a Modal
 *   overlay. None of them is 1px and none of them separates two regions.
 * - A **now-marker** is a value plotted on an axis, not a seam:
 *   `calendar-shell.tsx` and `calendar-timeline.tsx` draw the current time
 *   `bg-red-500`, and its redness *is* the information.
 *
 * What is left — and all this file claims — is **chrome**: a 1px edge whose
 * colour means nothing except "two things meet here". Removing its colour
 * removes only the seam. Two properties make it identifiable without guessing:
 *
 * 1. **Geometry.** `h-px` / `w-px` / `h-[1px]` / `w-[1px]` is a hairline and
 *    nothing else is shaped like one. This is the cheap signal and it covers
 *    all five of the #103 sites.
 * 2. **Hue.** Chrome is the family `--q-line` itself resolves to: cyan on dark
 *    (`#06b6d4`), ink on light (`#0b1120`) — so cyan, its neighbour sky, the
 *    achromatic scales, `white`, `black`, and a bare hex. An intent hue is out
 *    of scope by construction, which is what keeps the red now-markers and the
 *    tinted containers out of the report without an allowlist of paths.
 * 3. **Alpha.** Every one of the 167 `quebi-line` utilities in the library
 *    carries an alpha; not one is opaque, and on light an opaque `--q-line` is
 *    a black rule. So an *alpha'd* chrome edge is a hairline wherever it
 *    appears, and an *opaque* one is a deliberate opaque mark — `border-2
 *    border-white` ringing a ColorThumb against an unknown user colour, the
 *    `border-cyan-500` node of DaySchedule's cyan tone. Those are marks, and
 *    marks are `mark-contrast.test.ts`'s business. That premise is not left as
 *    a sentence: the last test pins it.
 *
 * So: **a hairline is a class group carrying hairline geometry, or an edge
 * utility carrying an alpha; in `src/components/**` its colour comes from
 * `quebi-line`, never from a raw chrome hue.**
 *
 * The unit is a *class group*, not a string literal, because `separator.tsx`
 * splits the two halves across a `cn()` — `"…bg-quebi-line/20…"` in one
 * argument, `"h-px w-full"` in the next — and a per-literal scan would miss the
 * component the token was added for.
 *
 * `src/registry/*.examples.tsx` is swept too: a `localScopes` entry excepts the
 * examples from `no-hardcoded-design-values` as well, and they are the files
 * agents copy verbatim out of `/api/components/<slug>.json`, so a shortcut
 * taken there propagates into consumer code.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"

const ROOT = join(import.meta.dir, "..")

/** The library source plus the examples agents copy out of the API. */
const SOURCES = [
  ...readdirSync(join(ROOT, "src", "components"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => join("src", "components", f)),
  ...readdirSync(join(ROOT, "src", "registry"))
    .filter((f) => f.endsWith(".examples.tsx"))
    .map((f) => join("src", "registry", f)),
].map((path) => ({ path, source: readFileSync(join(ROOT, path), "utf8") }))

/**
 * Comments blanked, offsets preserved.
 *
 * `skeleton.tsx` and `modal.tsx` both *name* the shapes below in prose — a
 * docblock explaining why a track is not a hairline would otherwise be reported
 * as one. Blanking rather than deleting keeps every line number honest.
 */
function blankComments(source: string) {
  const out = [...source]
  let i = 0
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== "\n") out[k] = " "
  }
  while (i < source.length) {
    const two = source.slice(i, i + 2)
    if (two === "//") {
      const end = source.indexOf("\n", i)
      blank(i, end === -1 ? source.length : end)
      i = end === -1 ? source.length : end
    } else if (two === "/*") {
      const end = source.indexOf("*/", i + 2)
      const stop = end === -1 ? source.length : end + 2
      blank(i, stop)
      i = stop
    } else if (source[i] === '"' || source[i] === "'" || source[i] === "`") {
      const quote = source[i]
      i++
      while (i < source.length && source[i] !== quote) i += source[i] === "\\" ? 2 : 1
      i++
    } else {
      i++
    }
  }
  return out.join("")
}

/** 0-based offset → 1-based line, for a report the orchestrator can act on. */
const lineOf = (source: string, index: number) => source.slice(0, index).split("\n").length

type Group = { text: string; index: number }

/**
 * The class groups in a source: every balanced `cn(…)` call, and every
 * double-quoted literal on its own.
 *
 * The union is deliberate. A literal inside a `cn()` is scanned twice, which
 * can only ever *add* a finding, never hide one — and the `cn()` is what pairs
 * `separator.tsx`'s colour with its `h-px`, which is the whole reason a literal
 * is not the unit.
 */
function classGroups(source: string): Group[] {
  const code = blankComments(source)
  const groups: Group[] = []
  for (const match of code.matchAll(/"(?:[^"\\\n]|\\.)*"/g)) {
    groups.push({ text: match[0], index: match.index })
  }
  for (const match of code.matchAll(/\bcn\(/g)) {
    let depth = 1
    let i = match.index + match[0].length
    while (i < code.length && depth > 0) {
      if (code[i] === "(") depth++
      else if (code[i] === ")") depth--
      i++
    }
    groups.push({ text: code.slice(match.index, i), index: match.index })
  }
  return groups
}

/** A Tailwind variant chain — `focus-visible:`, `dark:`, `[&>div]:`. */
const VARIANT = String.raw`(?:[\w:[\]./-]*:)?`
/** The hues `--q-line` resolves to, plus the achromatics and a bare hex. */
const CHROME = String.raw`(?:(?:cyan|sky|gray|grey|slate|zinc|neutral|stone)-\d{2,3}|white|black|\[#[0-9a-fA-F]{3,8}\]|\[(?:rgb|rgba|hsl|hsla|oklch)\([^\]]*\)\])`
const ALPHA = String.raw`(?:/(?:\[[\d.]+\]|\d+))`
/**
 * Properties that paint an *edge*. `bg-` is deliberately not one of them: an
 * alpha'd `bg-cyan-500/10` is a Skeleton, a Meter track or a hover tint far
 * more often than it is a rule, and the whole #103 exception exists for those.
 * A fill becomes a rule only when the geometry says so, which is the next
 * constant along.
 */
const EDGE = "(?:border|divide|ring|inset-ring|outline|stroke)(?:-[xytblrse])?"
/** Inside a group already shaped like a hairline, the fill is the rule too. */
const PAINT = "(?:bg|border|divide|ring|inset-ring|outline|stroke)(?:-[xytblrse])?"

const HAIRLINE_GEOMETRY = new RegExp(String.raw`(?<![-\w])${VARIANT}[hw]-(?:px|\[1px\])(?![\w-])`)
/** Any chrome-hued paint, alpha or not — only consulted inside a shaped group. */
const CHROME_PAINT = new RegExp(String.raw`(?<![-\w])${VARIANT}${PAINT}-${CHROME}${ALPHA}?(?![\w/-])`, "g")
/** An alpha'd chrome *edge* — a hairline wherever it appears, shaped or not. */
const ALPHAD_CHROME_EDGE = new RegExp(String.raw`(?<![-\w])${VARIANT}${EDGE}-${CHROME}${ALPHA}(?![\w/-])`, "g")
/** `border-quebi-line` and friends. Used to prove the sweep is not empty. */
const LINE_TOKEN = new RegExp(
  String.raw`(?<![-\w])${VARIANT}${PAINT}-quebi-line(?:/(?:\[[\d.]+\]|\d+))?(?![\w/-])`,
  "g",
)
/** The same, opaque — the premise the alpha half of the rule rests on. */
const OPAQUE_LINE_TOKEN = new RegExp(String.raw`(?<![-\w])${VARIANT}${PAINT}-quebi-line(?![\w/-])`, "g")

/** `matchAll` hands back an index; this keeps the arithmetic type-safe. */
const at = (match: RegExpMatchArray) => match.index ?? 0

type Finding = { path: string; line: number; klass: string; why: string }

/**
 * Every chrome-hued paint in a hairline position.
 *
 * A group shaped like a hairline puts *every* chrome paint in it under the
 * rule, fill included. Outside a shaped group only an alpha'd edge counts.
 * Either way the colour belongs to `quebi-line`.
 */
function hairlineViolations(path: string, source: string): Finding[] {
  const found = new Map<string, Finding>()
  for (const group of classGroups(source)) {
    const shaped = HAIRLINE_GEOMETRY.test(group.text)
    const matches = [...group.text.matchAll(shaped ? CHROME_PAINT : ALPHAD_CHROME_EDGE)]
    for (const match of matches) {
      const line = lineOf(source, group.index + at(match))
      found.set(`${line}:${match[0]}`, {
        path,
        line,
        klass: match[0],
        why: shaped ? "1px rule" : "alpha'd edge",
      })
    }
  }
  return [...found.values()].sort((a, b) => a.line - b.line)
}

/** `src/components/foo.tsx:12 — bg-cyan-500/10 (1px rule) → bg-quebi-line/10` */
const report = ({ path, line, klass, why }: Finding) => {
  const replacement = klass.replace(new RegExp(`${CHROME}(?=${ALPHA}?$)`), "quebi-line")
  return `${path}:${line} — ${klass} (${why}) → ${replacement}`
}

describe("a hairline in the library source is painted in quebi-line", () => {
  const violations = SOURCES.flatMap(({ path, source }) => hairlineViolations(path, source))

  test("no 1px rule, and no alpha'd chrome edge, is a raw palette scale", () => {
    expect(violations.map(report)).toEqual([])
  })
})

describe("the sweep is not vacuous", () => {
  const groups = SOURCES.flatMap(({ path, source }) =>
    classGroups(source).map((group) => ({ path, group })),
  )

  test("it saw the library's hairlines — geometry and token both", () => {
    // Loose floors on purpose: they guard against the regexes above going
    // quiet, not against either count moving. ~19 shaped groups, ~167 token
    // utilities at the time of writing.
    const shaped = groups.filter(({ group }) => HAIRLINE_GEOMETRY.test(group.text))
    const tokens = groups.flatMap(({ group }) => [...group.text.matchAll(LINE_TOKEN)])
    expect(shaped.length).toBeGreaterThan(8)
    expect(tokens.length).toBeGreaterThan(80)
  })

  test("and it saw the tints it must stay quiet about", () => {
    // The other half of vacuity: a rule that reported nothing because it looked
    // at nothing would pass the floor above too. These are the shapes the #103
    // exception exists for, they are present, and they are not in the report.
    const tints = groups.filter(({ group }) => /bg-cyan-500\/\d/.test(group.text))
    expect(tints.length).toBeGreaterThan(8)
  })
})

/**
 * The detector run over sources that do not exist — the #103 sites as they were
 * written *before* that PR, and the shapes the rule must not reach.
 *
 * This is the part that makes the green run above mean something. The tree is
 * clean today, so every assertion in this file would also pass if
 * `hairlineViolations` returned `[]` unconditionally; these fixtures are what
 * says it does not.
 */
const CAUGHT: [name: string, source: string][] = [
  [
    "separator.tsx — colour and geometry in different cn() arguments",
    `cn("shrink-0 border-0 bg-cyan-500/10 forced-colors:bg-[ButtonBorder]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)`,
  ],
  ["sidebar.tsx — a menu rule", `const x = "mx-auto h-px w-full border-0 bg-cyan-500/10"`],
  ["dropdown.tsx — a menu separator", `cn("col-span-full -mx-1 h-px bg-cyan-500/10", className)`],
  ["table.tsx — a column rule", `const x = "h-full w-px bg-cyan-500/20 py-(--gutter-y)"`],
  ["chart.tsx — a legend rule", `const x = "mt-2 mb-3 block h-px w-full bg-cyan-500/20"`],
  ["an alpha'd white edge, which no lint rule anywhere catches", `const x = "rounded-lg border border-white/10 p-4"`],
  ["an alpha'd divider", `const x = "divide-y divide-slate-700/40"`],
  ["a hex hairline", `const x = "h-px w-full bg-[#06b6d4]"`],
  ["an inset ring drawn as a hairline", `const x = "inset-ring inset-ring-gray-500/20"`],
  ["a 1px rule bordered in a raw scale", `const x = "h-px border-t border-zinc-800"`],
]

const IGNORED: [name: string, source: string][] = [
  ["a Skeleton tint — a fill, not an edge", `const x = "animate-pulse rounded-quebi-md bg-cyan-500/5"`],
  ["a Meter track", `const x = "h-1.5 w-full rounded-full border border-quebi-line/10 bg-cyan-500/10"`],
  ["a Modal scrim", `const x = "fixed inset-0 bg-black/60 backdrop-blur-sm"`],
  ["a Stepper connector — 2px, and the filled half is brand", `cn("mx-3.5 h-0.5 flex-1", done ? "bg-quebi-brand" : "bg-cyan-500/10")`],
  ["an intent-tinted container", `const x = "border border-red-500/20 bg-red-500/10 text-quebi-danger"`],
  ["an invalid control's ring", `const x = "invalid:ring-2 invalid:ring-red-500/50"`],
  ["a mint fill's edge — task #145's token", `const x = "border border-quebi-brand-mark bg-quebi-brand"`],
  ["a now-marker — the red is the information", `cn("pointer-events-none absolute inset-y-0 w-px bg-red-500")`],
  ["a ColorThumb's opaque ring against an unknown colour", `cn("size-6 rounded-full border-2 border-white", className)`],
  ["DaySchedule's cyan tone node", `const TONES = { cyan: { bar: "bg-cyan-500", node: "border-cyan-500" } }`],
  ["a forced-colors system colour", `const x = "h-px bg-quebi-line/20 forced-colors:bg-[ButtonBorder]"`],
  ["the token itself, in every alpha form", `cn("h-px bg-quebi-line/[0.06]", "border-quebi-line/10 divide-quebi-line/20")`],
  ["prose naming the shape", `/** The rule is a bg-cyan-500/10 hairline: h-px and wrong. */`],
]

describe("the detector itself", () => {
  test.each(CAUGHT)("catches: %s", (_name, source) => {
    expect(hairlineViolations("fixture.tsx", source)).not.toEqual([])
  })

  test.each(IGNORED)("stays quiet on: %s", (_name, source) => {
    expect(hairlineViolations("fixture.tsx", source).map(report)).toEqual([])
  })

  test("it names the replacement, not just the offence", () => {
    const found = hairlineViolations("separator.tsx", `cn("bg-cyan-500/10", "h-px w-full")`)
    expect(found.map(report)).toEqual([
      "separator.tsx:1 — bg-cyan-500/10 (1px rule) → bg-quebi-line/10",
    ])
  })
})

/**
 * The cheapest check the task itself proposes: *run the detector against the
 * tree as it was before #103*. Rather than pinning line numbers that every
 * restyle moves, the tree is mutated — `quebi-line` swapped back for the raw
 * `cyan-500` it used to be — and the detector has to find the damage.
 *
 * This is the assertion that cannot be satisfied by a detector that returns
 * nothing, and it is measured over the real sources rather than over strings
 * this file wrote, so it keeps working as components are added.
 */
describe("the tree with its token swapped back out is reported", () => {
  const mutated = SOURCES.map(({ path, source }) => ({
    path,
    findings: hairlineViolations(path, source.replaceAll("quebi-line", "cyan-500")),
  }))

  test("the damage is found, across the library, in both triggers", () => {
    const findings = mutated.flatMap((m) => m.findings)
    // 183 findings in 89 files, 9 of them shaped rules, at the time of writing.
    // Loose floors: they guard the detector, not the counts.
    expect(findings.length).toBeGreaterThan(120)
    expect(mutated.filter((m) => m.findings.length > 0).length).toBeGreaterThan(50)
    expect(findings.filter((f) => f.why === "1px rule").length).toBeGreaterThanOrEqual(5)
  })

  test("Separator in particular — the component that *is* a hairline", () => {
    const separator = mutated.find((m) => m.path.endsWith("separator.tsx"))
    expect(separator?.findings.map((f) => f.klass)).toContain("bg-cyan-500/20")
  })
})

describe("the premise: the hairline token is never opaque", () => {
  test("every quebi-line utility in the library carries an alpha", () => {
    // The alpha half of the rule — "an alpha'd chrome edge is a hairline, an
    // opaque one is a mark" — is only a usable boundary while this holds. It is
    // not a style preference: `--q-line` is ink under `.light`, so an opaque
    // one draws a black rule across a white card, and cyan-500 at full strength
    // on dark is a highlight rather than a seam. If this ever fails, the
    // boundary above has to be redrawn before the failing site is accepted.
    const opaque = SOURCES.flatMap(({ path, source }) =>
      classGroups(source).flatMap((group) =>
        [...group.text.matchAll(OPAQUE_LINE_TOKEN)].map(
          (m) => `${path}:${lineOf(source, group.index + m.index)} — ${m[0]}`,
        ),
      ),
    )
    expect([...new Set(opaque)]).toEqual([])
  })
})
