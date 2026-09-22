/**
 * One dynamic import per component's baked source module.
 *
 * `scripts/api/components.ts` emits `sources/<slug>.generated.ts` per component
 * rather than one `Record<slug, …>` for all of them, because a record literal
 * is a single binding: reading one entry pulled all 152 components' Shiki
 * markup — 9.6 MB of it — into the component route's chunk. Splitting the
 * examples (task #171) left that untouched, and it was the larger half.
 *
 * Vite-only, like ./examples-lazy.ts, and apart from the generated modules for
 * the same reason: `bun test` does not resolve `import.meta.glob`.
 */
import { importChunk } from "@/lib/stale-deploy"

const modules = import.meta.glob<SourceModule>("./sources/*.generated.ts")

interface SourceModule {
  source: string
  highlighted: string
}

/** The baked source for one slug, or `undefined` if it has no generated module. */
export async function loadSource(slug: string): Promise<SourceModule | undefined> {
  const load = modules[`./sources/${slug}.generated.ts`]
  if (!load) return undefined
  const { source, highlighted } = await importChunk(load)
  return { source, highlighted }
}
