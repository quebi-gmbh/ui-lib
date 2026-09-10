/**
 * The files a client fetches before it fetches anything else.
 *
 * `api/index.json` is the catalog an agent reads first, `api/registry.json` its
 * shadcn-shaped twin, `llms.txt` the prose entry point, and sitemap.xml /
 * robots.txt the same information for search engines. Every one of them is a
 * different rendering of the catalog and the rule records — none of them a second
 * source for either.
 */
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { metaRegistry } from "../../src/registry/meta"
import { rulesRegistry } from "../../src/registry/rules"
import { API, BASE_URL, PUBLIC } from "./context"
import type { RegistryIndexEntry } from "./components"
import { rulesLlmsSection } from "./rules"

export async function emitDiscoveryFiles({
  catalog,
  registryIndex,
  rulesCount,
}: {
  catalog: unknown[]
  registryIndex: RegistryIndexEntry[]
  rulesCount: number
}): Promise<void> {
  // index.json — the one file an agent fetches first
  await writeFile(
    join(API, "index.json"),
    JSON.stringify(
      {
        name: "ui-lib",
        description: "quebi React component library. Copy-paste source, no install required.",
        baseUrl: BASE_URL,
        count: catalog.length,
        components: catalog,
        rules: {
          count: rulesCount,
          description:
            "Usage rules for consuming apps: when a raw HTML element is allowed and which component to import when it is not.",
          url: `${BASE_URL}/api/rules.json`,
        },
      },
      null,
      2,
    ),
  )

  // shadcn registry index
  await writeFile(
    join(API, "registry.json"),
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: "ui-lib",
        homepage: BASE_URL,
        items: registryIndex,
      },
      null,
      2,
    ),
  )

  // llms.txt — discovery entry point for AI agents
  const llms = [
    "# ui-lib",
    "",
    `> quebi React component library: ${catalog.length} components built on react-aria-components and Tailwind, styled with the quebi design system. Copy-paste source, no package install required. Every component is self-contained.`,
    "",
    "This file tells AI coding agents how to find and pull components programmatically.",
    "",
    "## Stack",
    "",
    "- React 19 + TypeScript, `react-aria-components` (accessibility), `tailwind-variants`, Tailwind CSS v4.",
    "- Components import a shared `cn` helper from `@/lib/utils` and may import sibling components from `@/components/<name>`. Both are listed in each component's `registryDependencies` and must be pulled too.",
    "",
    "## Discovery endpoints",
    "",
    `- [${BASE_URL}/api/index.json](${BASE_URL}/api/index.json) — full catalog: every component with name, description, category, tags, npm \`dependencies\`, \`registryDependencies\`, and file URLs. Fetch this first.`,
    `- ${BASE_URL}/api/components/<name>.json — one component: the above plus inlined raw \`source\` and syntax-highlighted \`highlighted\` HTML.`,
    `- ${BASE_URL}/api/components/<name>.tsx — raw, copy-paste-ready source.`,
    `- [${BASE_URL}/api/registry.json](${BASE_URL}/api/registry.json) — shadcn-compatible registry index.`,
    `- ${BASE_URL}/r/<name>.json — shadcn registry item (source + resolved dependency URLs).`,
    `- [${BASE_URL}/api/rules.json](${BASE_URL}/api/rules.json) — usage rules: when a raw HTML element is allowed, and what to import when it is not. Read this before writing JSX against the library.`,
    `- ${BASE_URL}/api/rules/<id>.json — one rule: rationale, wrong/right pair, exceptions, and a \`checks\` array of runnable Biome/ripgrep snippets generated from it.`,
    `- ${BASE_URL}/api/rules/biome.jsonc — every rule as one Biome config, with the documented exceptions applied.`,
    `- ${BASE_URL}/api/rules/plugins/<id>.grit — the GritQL plugin for a rule Biome has no built-in for.`,
    "",
    "## How an agent uses this",
    "",
    "Recommended (shadcn CLI — resolves all dependencies automatically):",
    "",
    "```sh",
    `npx shadcn@latest add ${BASE_URL}/r/<name>.json`,
    "```",
    "",
    "Manual (any agent, any toolchain):",
    "",
    `1. \`GET ${BASE_URL}/api/index.json\` and pick a component by matching the user's need against \`name\`/\`description\`/\`tags\` (do the matching yourself — there is no search endpoint; the catalog is small enough to reason over directly).`,
    "2. `GET /api/components/<name>.json` for that component.",
    "3. Write its `source` to your project (e.g. `components/ui/<name>.tsx`).",
    "4. Recursively resolve `registryDependencies` — each is another ui-lib component slug or a shared lib (e.g. `lib-utils` → `lib/utils.ts`). Fetch and add each the same way.",
    "5. Install the npm packages listed in `dependencies`.",
    "",
    "Notes for agents:",
    "- `@/` is an alias for the project `src/` root; rewrite it to match the target project's import alias if different.",
    "- Conform-bound form variants are the `conform-*` components; they wrap a base component and bind it to the Conform form library.",
    "- Prefer fetching `.json` over scraping the HTML pages at `/components/<name>`.",
    "",
    ...rulesLlmsSection(),
    "## Components",
    ...metaRegistry.map(
      (m) => `- [${m.name}](${BASE_URL}/api/components/${m.slug}.json): ${m.description}`,
    ),
    "",
  ].join("\n")
  await writeFile(join(PUBLIC, "llms.txt"), llms)

  // sitemap.xml — every prerendered page, for search engines.
  const urls = [
    "/",
    "/components",
    ...metaRegistry.map((m) => `/components/${m.slug}`),
    "/rules",
    "/rules/enforcement",
    ...rulesRegistry.map((r) => `/rules/${r.id}`),
  ]
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${BASE_URL}${u}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n")
  await writeFile(join(PUBLIC, "sitemap.xml"), sitemap)

  // robots.txt — allow all, point at the sitemap and the agent entry point.
  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    "",
  ].join("\n")
  await writeFile(join(PUBLIC, "robots.txt"), robots)
}
