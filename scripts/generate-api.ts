/**
 * Generates the static AI-discovery API from source.
 *
 * Reads the metadata registry (src/registry/meta.ts) + each component's source
 * (src/components/<slug>.tsx) and emits, into public/ so Vite copies it to dist:
 *
 *   api/index.json              full catalog (one fetch = whole library)
 *   api/components/<slug>.json  per-component metadata + deps + source URL
 *   api/components/<slug>.tsx   raw, copy-paste-ready source
 *   r/<slug>.json               shadcn-compatible registry item
 *   api/registry.json           index of shadcn registry items
 *   api/rules.json              every usage rule, with its runnable checks
 *   llms.txt                    entry point for AI agents
 *
 * Run: bun run scripts/generate-api.ts   (wired into `bun run build`)
 *
 * Nothing here is hand-written JSON — metadata comes from the registry,
 * source/deps are derived from the .tsx files. Single source of truth.
 *
 * This file is the order the passes run in and the values they hand each other;
 * each pass lives in `scripts/api/`. The order is not arbitrary: the component
 * pass reads the library's source, and both of the things the rule pass needs —
 * the slugs a rule may point at, and the react-aria primitives app code may not
 * import — are derived from it.
 */
import { metaRegistry } from "../src/registry/meta"
import { deriveRacPrimitives } from "../src/registry/rules/checks"
import { emitComponents } from "./api/components"
import { createHighlight, freshOutputDirs } from "./api/context"
import { emitDiscoveryFiles } from "./api/discovery"
import { emitRules } from "./api/rules"
import { emitSkill } from "./api/skill"

async function main() {
  const highlight = await createHighlight()
  await freshOutputDirs()

  const { catalog, registryIndex, sources } = await emitComponents(highlight)

  // The primitives app code may not import are exactly the ones the library
  // wraps, read from the sources gathered above — never a hand-kept list. Both
  // the published config and each rule page's own snippet are built from it, so
  // a rule page cannot show options the config does not have.
  const racPrimitives = deriveRacPrimitives(sources.map((s) => s.source))
  const { rulesCatalog } = await emitRules(
    highlight,
    new Set(metaRegistry.map((m) => m.slug)),
    racPrimitives,
  )

  await emitDiscoveryFiles({ catalog, registryIndex, rulesCount: rulesCatalog.length })
  await emitSkill(highlight, catalog.length)

  console.log(
    `Generated API for ${catalog.length} component(s) and ${rulesCatalog.length} rule(s): api/index.json, api/components/*, api/rules.json, api/rules/* (+ biome.jsonc, plugins/*.grit), r/*, registry.json, llms.txt, sitemap.xml, robots.txt`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
