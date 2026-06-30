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
 *   llms.txt                    entry point for AI agents
 *
 * Run: bun run scripts/generate-api.ts   (wired into `bun run build`)
 *
 * Nothing here is hand-written JSON — metadata comes from the registry,
 * source/deps are derived from the .tsx files. Single source of truth.
 */
import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createHighlighter } from "shiki"
import { metaRegistry } from "../src/registry/meta"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const COMPONENTS_DIR = join(ROOT, "src/components")
const SRC_DIR = join(ROOT, "src")
const PUBLIC = join(ROOT, "public")
const API = join(PUBLIC, "api")
const COMPONENTS_OUT = join(API, "components")
const REGISTRY_OUT = join(PUBLIC, "r")

const BASE_URL = "https://ui-lib.quebi.de"

/** Parse `import` specifiers from source. */
function parseImports(source: string): string[] {
  const specs = new Set<string>()
  const re = /import\s+(?:type\s+)?(?:[^"'`]+\s+from\s+)?["'`]([^"'`]+)["'`]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) specs.add(m[1])
  return [...specs]
}

/** kebab id for a lib module (lib/utils -> "lib-utils") used as a registry name. */
function libName(libPath: string) {
  return libPath.split("/").join("-")
}

/**
 * Split parsed imports into:
 *  - dependencies:         npm packages
 *  - componentDeps:        sibling ui-lib components (slugs)
 *  - libDeps:              shared lib modules (e.g. "lib/utils"), shipped as
 *                          their own registry items so components stay self-contained
 */
function classifyDeps(specs: string[], allSlugs: Set<string>) {
  const dependencies = new Set<string>()
  const componentDeps = new Set<string>()
  const libDeps = new Set<string>()

  for (const spec of specs) {
    if (spec.startsWith("@/components/")) {
      const slug = spec.replace("@/components/", "")
      if (allSlugs.has(slug)) componentDeps.add(slug)
    } else if (spec.startsWith("@/lib/")) {
      // Shared helper (e.g. @/lib/utils) — ship it as a registry dependency
      // rather than duplicating it into every component.
      libDeps.add(spec.replace("@/", ""))
    } else if (spec.startsWith("@/") || spec.startsWith(".")) {
      // Other internal import — bundled with the source, not an npm package.
    } else {
      // Bare specifier → npm package. Normalize scoped/subpath to the package name.
      const pkg = spec.startsWith("@")
        ? spec.split("/").slice(0, 2).join("/")
        : spec.split("/")[0]
      dependencies.add(pkg)
    }
  }
  return {
    dependencies: [...dependencies].sort(),
    componentDeps: [...componentDeps].sort(),
    libDeps: [...libDeps].sort(),
  }
}

async function main() {
  const allSlugs = new Set(metaRegistry.map((m) => m.slug))

  // Shiki highlighter — pre-renders source to HTML at build time so the SPA
  // ships no highlighter. "vesper" is a dark theme; we override its background
  // to sit on the quebi surface (transparent → the page bg shows through).
  const highlighter = await createHighlighter({
    themes: ["vesper"],
    langs: ["tsx"],
  })
  const highlight = (code: string) =>
    highlighter.codeToHtml(code, {
      lang: "tsx",
      theme: "vesper",
      colorReplacements: { "#101010": "transparent" },
    })

  // Fresh output dirs.
  await rm(API, { recursive: true, force: true })
  await rm(REGISTRY_OUT, { recursive: true, force: true })
  await mkdir(COMPONENTS_OUT, { recursive: true })
  await mkdir(REGISTRY_OUT, { recursive: true })

  const catalog: unknown[] = []
  const registryIndex: { name: string; title: string; url: string }[] = []
  // Shared lib modules referenced by any component — emitted once at the end.
  const usedLibs = new Set<string>()

  for (const meta of metaRegistry) {
    const srcPath = join(COMPONENTS_DIR, `${meta.slug}.tsx`)
    if (!existsSync(srcPath)) {
      throw new Error(`Missing source for "${meta.slug}": ${srcPath}`)
    }
    const source = await readFile(srcPath, "utf8")
    const { dependencies, componentDeps, libDeps } = classifyDeps(
      parseImports(source),
      allSlugs,
    )
    for (const lib of libDeps) usedLibs.add(lib)

    // registryDependencies in our JSON lists both sibling components and the
    // shared libs the component needs — everything that must be pulled too.
    const registryDependencies = [
      ...componentDeps,
      ...libDeps.map(libName),
    ].sort()

    const files = {
      source: `/api/components/${meta.slug}.tsx`,
      meta: `/api/components/${meta.slug}.json`,
      html: `/api/components/${meta.slug}.html`,
      registryItem: `/r/${meta.slug}.json`,
    }

    // 1. raw source
    await writeFile(join(COMPONENTS_OUT, `${meta.slug}.tsx`), source)

    // 2. syntax-highlighted HTML (Shiki, build-time)
    const highlighted = highlight(source)
    await writeFile(join(COMPONENTS_OUT, `${meta.slug}.html`), highlighted)

    // 3. per-component metadata (source + highlighted HTML inlined so the
    //    detail page and agents get everything in one fetch)
    const componentJson = {
      ...meta,
      dependencies,
      registryDependencies,
      files,
      source,
      highlighted,
    }
    await writeFile(
      join(COMPONENTS_OUT, `${meta.slug}.json`),
      JSON.stringify(componentJson, null, 2),
    )

    // 3. shadcn-compatible registry item.
    // registryDependencies become full URLs so `npx shadcn add` resolves them.
    const registryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: meta.slug,
      type: "registry:component",
      title: meta.name,
      description: meta.description,
      dependencies,
      registryDependencies: [
        ...componentDeps.map((slug) => `${BASE_URL}/r/${slug}.json`),
        ...libDeps.map((lib) => `${BASE_URL}/r/${libName(lib)}.json`),
      ],
      files: [
        {
          path: `components/${meta.slug}.tsx`,
          content: source,
          type: "registry:component",
          target: `components/ui/${meta.slug}.tsx`,
        },
      ],
    }
    await writeFile(
      join(REGISTRY_OUT, `${meta.slug}.json`),
      JSON.stringify(registryItem, null, 2),
    )

    catalog.push({ ...meta, dependencies, registryDependencies, files })
    registryIndex.push({
      name: meta.slug,
      title: meta.name,
      url: `${BASE_URL}/r/${meta.slug}.json`,
    })
  }

  // Emit a registry item for each shared lib module a component depends on,
  // so components stay self-contained (no dangling @/lib import).
  for (const lib of [...usedLibs].sort()) {
    const libSrcPath = join(SRC_DIR, `${lib}.ts`)
    if (!existsSync(libSrcPath)) {
      throw new Error(`Component depends on @/${lib} but ${libSrcPath} is missing`)
    }
    const libSource = await readFile(libSrcPath, "utf8")
    const { dependencies } = classifyDeps(parseImports(libSource), allSlugs)
    const name = libName(lib)

    const libItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name,
      type: "registry:lib",
      title: lib,
      description: `Shared helper (${lib}) required by ui-lib components.`,
      dependencies,
      registryDependencies: [],
      files: [
        {
          path: `${lib}.ts`,
          content: libSource,
          type: "registry:lib",
          target: `${lib}.ts`,
        },
      ],
    }
    await writeFile(join(REGISTRY_OUT, `${name}.json`), JSON.stringify(libItem, null, 2))
    registryIndex.push({ name, title: lib, url: `${BASE_URL}/r/${name}.json` })
  }

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
    "## Components",
    ...metaRegistry.map(
      (m) => `- [${m.name}](${BASE_URL}/api/components/${m.slug}.json): ${m.description}`,
    ),
    "",
  ].join("\n")
  await writeFile(join(PUBLIC, "llms.txt"), llms)

  console.log(
    `Generated API for ${catalog.length} component(s): api/index.json, api/components/*, r/*, registry.json, llms.txt`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
