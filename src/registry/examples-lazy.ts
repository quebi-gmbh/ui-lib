import type { ComponentExample } from "./types"

/**
 * One dynamic import per `<slug>.examples.tsx`, so a component page downloads
 * its own examples and nothing else.
 *
 * `./index.ts` deliberately keeps its 154 *static* imports: it is what the test
 * suite reads synchronously, and it is the honest shape for "the whole registry
 * as one value". But those static imports are also what made every component
 * page ship every example — a 9.29 MB route chunk to render one component's
 * gallery (task #171). The gallery route reaches examples through here instead,
 * and Vite gives each `*.examples.tsx` its own chunk.
 *
 * `import.meta.glob` rather than 154 hand-written lines: the glob is resolved by
 * Vite at build time from the same filenames `./index.ts` imports, so a new
 * component cannot be added to one list and forgotten in the other. It is a
 * Vite-only construct, which is the other reason this lives apart from
 * `./index.ts` — `bun test` imports that file directly and would not understand
 * this one.
 */
const modules = import.meta.glob<ExamplesModule>("./*.examples.tsx")

type ExamplesModule = Record<string, unknown>

/**
 * Each component's examples file exports exactly one `…Examples` array
 * (`alertDialogExamples`, `areaChartExamples`, …), so the array is picked by
 * export-name suffix.
 *
 * Not "the first array export", which is the obvious shortcut and is wrong:
 * `table-fixtures.examples.tsx` matches the same glob, is shared fixture data
 * rather than a gallery, and exports five arrays and no `…Examples` at all. It
 * is never requested here — no component has that slug — but a by-shape pick
 * would have quietly returned its country list to anyone who did.
 *
 * Not "rebuild the camelCase name from the slug" either: `input-otp` →
 * `inputOtpExamples` is a guess about how a name round-trips.
 * `tests/registry-examples.test.ts` pins the convention this relies on.
 */
function pickExamples(mod: ExamplesModule): ComponentExample[] {
  for (const [name, value] of Object.entries(mod)) {
    if (name.endsWith("Examples") && Array.isArray(value)) return value as ComponentExample[]
  }
  return []
}

/** The examples for one slug, or `[]` if the slug has no examples file. */
export async function loadExamples(slug: string): Promise<ComponentExample[]> {
  const load = modules[`./${slug}.examples.tsx`]
  if (!load) return []
  return pickExamples(await load())
}

/** Slugs that have an examples file, for tests and for the glob's own coverage. */
export function slugsWithExamples(): string[] {
  return Object.keys(modules).map((path) => path.slice("./".length, -".examples.tsx".length))
}
