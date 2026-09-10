/**
 * The component half of the generated API.
 *
 * For every entry in the metadata registry: the raw source, its Shiki HTML, the
 * per-component JSON an agent fetches, and the shadcn registry item. Plus the
 * shared `@/lib/*` modules those components import, emitted as registry items of
 * their own so a copied component never lands with a dangling import.
 *
 * Nothing here is hand-written JSON: metadata comes from the registry, and
 * dependencies are read out of the `.tsx` files.
 */
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { metaRegistry } from "../../src/registry/meta"
import {
  BASE_URL,
  COMPONENTS_DIR,
  COMPONENTS_OUT,
  type Highlight,
  REGISTRY_OUT,
  SRC_DIR,
} from "./context"

/** Parse `import` specifiers from source. */
function parseImports(source: string): string[] {
  const re = /import\s+(?:type\s+)?(?:[^"'`]+\s+from\s+)?["'`]([^"'`]+)["'`]/g
  return [...new Set([...source.matchAll(re)].map((match) => match[1]))]
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

/** One component's source and its build-time HTML, for the generated bake module. */
export interface ComponentSource {
  slug: string
  source: string
  highlighted: string
}

/** An entry in the shadcn registry index. */
export interface RegistryIndexEntry {
  name: string
  title: string
  url: string
}

/**
 * Emit every component, the shared libs they pull in, and the generated module
 * that bakes source into the prerendered detail pages.
 */
export async function emitComponents(highlight: Highlight): Promise<{
  catalog: unknown[]
  registryIndex: RegistryIndexEntry[]
  sources: ComponentSource[]
}> {
  const allSlugs = new Set(metaRegistry.map((m) => m.slug))
  const catalog: unknown[] = []
  const registryIndex: RegistryIndexEntry[] = []
  // Shared lib modules referenced by any component — emitted once at the end.
  const usedLibs = new Set<string>()
  // slug -> { source, highlighted } baked into a TS module so the detail page
  // renders source into static HTML at SSG build (no runtime fetch).
  const sources: ComponentSource[] = []

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
    sources.push({ slug: meta.slug, source, highlighted })
  }

  // Generated TS module: slug -> { source, highlighted }. Imported by the
  // component detail page so the source is baked into the prerendered HTML.
  const sourcesModule = [
    "// AUTO-GENERATED by scripts/generate-api.ts. Do not edit.",
    "export interface ComponentSource {",
    "  source: string",
    "  highlighted: string",
    "}",
    "",
    "export const componentSources: Record<string, ComponentSource> = {",
    ...sources.map(
      (s) =>
        `  ${JSON.stringify(s.slug)}: { source: ${JSON.stringify(s.source)}, highlighted: ${JSON.stringify(s.highlighted)} },`,
    ),
    "}",
    "",
  ].join("\n")
  await writeFile(join(SRC_DIR, "registry/sources.generated.ts"), sourcesModule)

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

  return { catalog, registryIndex, sources }
}
