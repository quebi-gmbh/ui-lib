import { Suspense, lazy, type ComponentType } from "react"
import { Link, data, useParams } from "react-router"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card } from "@/components/card"
import { metaRegistry } from "@/registry/meta"
import { loadExamples } from "@/registry/examples-lazy"
import { loadSource } from "@/registry/sources-lazy"
import { CodeBlock } from "@/site/code-block"
import {
  CodeBlockSkeleton,
  ExampleBodySkeleton,
  GallerySkeleton,
  SourceUnavailable,
} from "@/site/page-states"
import { seo } from "@/lib/seo"
import type { ComponentExample } from "@/registry/types"
import type { Route } from "./+types/components.$slug"

export async function loader({ params }: Route.LoaderArgs) {
  const component = metaRegistry.find((c) => c.slug === params.slug)
  if (!component) throw data("Not found", { status: 404 })
  // Return only serializable fields for meta + prerender; the live examples are
  // loaded as their own chunk by <Gallery> (render fns aren't serializable).
  //
  // `exampleCount` is the exception that proves the rule: how many examples are
  // coming is the one thing the gallery's skeleton needs and the one thing the
  // metadata does not carry. It is counted here rather than generated into a
  // module or guessed at in the fallback because this loader is *already* the
  // build-time half of the page — `ssr: false` + `prerender()` runs it in Node
  // at build and writes the answer into `build/client/components/<slug>.data`,
  // which the browser has in hand (embedded on first load, fetched on a
  // navigation) before the route renders. So the count costs one number in a
  // file that is already downloaded, and the examples chunk it counted is not
  // shipped to the client on its account.
  return {
    slug: component.slug,
    name: component.name,
    description: component.description,
    category: component.category,
    exampleCount: (await loadExamples(component.slug)).length,
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
 * `lazy` rather than an effect because this site is prerendered: React resolves
 * a Suspense boundary during the render that writes the HTML, and an effect
 * would run after the markup was already emitted — the examples would simply be
 * missing from the static page.
 *
 * What the build writes for this route is worth knowing exactly, because it is
 * not quite what `src/entry.server.tsx` reads like. The prerender streams: the
 * fallback goes out in place with a `<!--$?-->` marker, and each boundary's real
 * content lands at the end of the document in a `<div hidden id="S:n">` with a
 * `$RC` call after it. The browser's parser runs that script and swaps the
 * content in before hydration, so the finished HTML does hold the resolved
 * gallery and the DOM React hydrates is the same one `onAllReady` would have
 * produced — but a reader of the file who greps the built page for an example
 * will not find it where the fallback is.
 *
 * Which raises the question this route's boundaries had to answer before any of
 * the skeletons below were worth drawing: that markup is in place when React
 * starts, and the examples chunk is not, so does React throw it away and paint
 * the fallback over it — content, skeleton, content, which is worse than no
 * skeleton at all?
 *
 * Measured, and no: React 19 leaves a suspended boundary's server HTML in place
 * and hydrates it when the lazy resolves. `tests/hydration-boundaries.test.tsx`
 * pins both that and its one exception — a re-render *from above* while the
 * boundary is still dehydrated does force a client render, and then the
 * fallback does replace the content. Nothing between the router and these
 * boundaries holds state that changes on its own today; a future ancestor that
 * does would turn every component page into that flash, and the test says so.
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
        // A missing source is an answer, not a wait: it gets words, not the
        // pulse the boundary above is already using to mean "still coming".
        default: () =>
          data ? (
            <CodeBlock html={data.highlighted} code={data.source} />
          ) : (
            <SourceUnavailable slug={slug} />
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
      {examples.map((example, index) => (
        <div key={example.title}>
          <h2 className="text-lg font-semibold text-quebi-fg">{example.title}</h2>
          {example.description && (
            <p className="mt-1 text-sm leading-relaxed text-quebi-fg-muted">
              {example.description}
            </p>
          )}
          <Card className="mt-4 min-h-30 items-center justify-center p-8">
            {/* One boundary per card, inside the card. An example that reaches
                for something of its own — a lazily imported chart, a resource
                read with `use()` — blanks its own box and leaves its heading,
                its description and the fourteen cards around it alone. Without
                it the first example to suspend takes the whole gallery back to
                the fallback. */}
            <Suspense fallback={<ExampleBodySkeleton index={index} />}>
              {example.render()}
            </Suspense>
          </Card>
        </div>
      ))}
    </>
  )
}

export default function ComponentDetail({ loaderData }: Route.ComponentProps) {
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
        <Suspense fallback={<GallerySkeleton count={loaderData.exampleCount} />}>
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
          <Suspense fallback={<CodeBlockSkeleton />}>
            <Source />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
