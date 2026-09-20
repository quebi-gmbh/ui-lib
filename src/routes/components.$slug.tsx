import { Suspense, lazy, type ComponentType } from "react"
import { Link, data, useParams } from "react-router"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card } from "@/components/card"
import { Skeleton } from "@/components/skeleton"
import { metaRegistry } from "@/registry/meta"
import { loadExamples } from "@/registry/examples-lazy"
import { loadSource } from "@/registry/sources-lazy"
import { CodeBlock } from "@/site/code-block"
import { seo } from "@/lib/seo"
import type { ComponentExample } from "@/registry/types"
import type { Route } from "./+types/components.$slug"

export function loader({ params }: Route.LoaderArgs) {
  const component = metaRegistry.find((c) => c.slug === params.slug)
  if (!component) throw data("Not found", { status: 404 })
  // Return only serializable fields for meta + prerender; the live examples are
  // loaded as their own chunk by <Gallery> (render fns aren't serializable).
  return {
    slug: component.slug,
    name: component.name,
    description: component.description,
    category: component.category,
  }
}

export function meta({ loaderData: d }: Route.MetaArgs) {
  if (!d) return seo({ title: "Not found", description: "Component not found.", path: "/components" })
  return seo({
    title: d.name,
    description: d.description,
    path: `/components/${d.slug}`,
    image: `/og/${d.slug}.jpg`,
  })
}

/**
 * One `React.lazy` per slug, cached so a re-render does not rebuild the
 * component type and remount the gallery.
 *
 * `lazy` rather than an effect because this site is prerendered: the build
 * renders in SPA mode, `src/entry.server.tsx` picks `onAllReady` for that, and
 * React therefore waits for every Suspense boundary to resolve before it writes
 * the HTML. An effect would run after the markup was already emitted and the
 * examples would be missing from the static page.
 */
const galleries = new Map<string, ComponentType>()

function galleryFor(slug: string): ComponentType {
  let Gallery = galleries.get(slug)
  if (!Gallery) {
    Gallery = lazy(async () => {
      const examples = await loadExamples(slug)
      return { default: () => <ExampleList examples={examples} /> }
    })
    galleries.set(slug, Gallery)
  }
  return Gallery
}

/** The same per-slug lazy treatment for the baked source block. */
const sourceBlocks = new Map<string, ComponentType>()

function sourceFor(slug: string): ComponentType {
  let Source = sourceBlocks.get(slug)
  if (!Source) {
    Source = lazy(async () => {
      const data = await loadSource(slug)
      return {
        default: () =>
          data ? (
            <CodeBlock html={data.highlighted} code={data.source} />
          ) : (
            <Skeleton className="h-40 rounded-quebi-md" />
          ),
      }
    })
    sourceBlocks.set(slug, Source)
  }
  return Source
}

function ExampleList({ examples }: { examples: ComponentExample[] }) {
  return (
    <>
      {examples.map((example) => (
        <div key={example.title}>
          <h2 className="text-lg font-semibold text-quebi-fg">{example.title}</h2>
          {example.description && (
            <p className="mt-1 text-sm leading-relaxed text-quebi-fg-muted">
              {example.description}
            </p>
          )}
          <Card className="mt-4 min-h-30 items-center justify-center p-8">{example.render()}</Card>
        </div>
      ))}
    </>
  )
}

export default function ComponentDetail() {
  const { slug } = useParams()
  const component = slug ? metaRegistry.find((c) => c.slug === slug) : undefined

  if (!component) return null

  const Gallery = galleryFor(component.slug)
  const Source = sourceFor(component.slug)

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-quebi-fg-subtle">
          <li>
            <Link
              to="/components"
              className="text-quebi-fg-muted transition-colors duration-200 hover:text-quebi-fg"
            >
              Components
            </Link>
          </li>
          <li aria-hidden className="flex items-center">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="font-medium text-quebi-fg" aria-current="page">
            {component.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6">
        <span className="quebi-eyebrow">{component.category}</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">
          {component.name}
        </h1>
        <p className="mt-3 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
          {component.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {component.tags.map((tag) => (
            <Badge key={tag} intent="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-10">
        <Suspense fallback={<Skeleton className="h-60 rounded-quebi-md" />}>
          <Gallery />
        </Suspense>
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-semibold text-quebi-fg">Source</h2>
        <p className="mt-1 text-sm leading-relaxed text-quebi-fg-muted">
          Copy this into your project. Resolve its dependencies from the{" "}
          <code className="text-quebi-fg-subtle">registryDependencies</code> in the component's API
          entry.
        </p>
        <div className="mt-4">
          <Suspense fallback={<Skeleton className="h-40 rounded-quebi-md" />}>
            <Source />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
