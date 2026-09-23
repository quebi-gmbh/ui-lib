import { Fragment, Suspense, lazy, type ComponentType } from "react"
import { Link, data, useParams } from "react-router"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card } from "@/components/card"
import { Link as UiLink } from "@/components/link"
import { Code } from "@/components/text"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { metaRegistry } from "@/registry/meta"
import { loadExamples } from "@/registry/examples-lazy"
import { loadSource } from "@/registry/sources-lazy"
import { CodeBlock } from "@/site/code-block"
import {
  AlternativesSkeleton,
  CodeBlockSkeleton,
  ExampleBodySkeleton,
  GallerySkeleton,
  SourceUnavailable,
} from "@/site/page-states"
import { seo } from "@/lib/seo"
import type { ComponentExample, ComponentUsage } from "@/registry/types"
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
    // Counted apart, because they are drawn in two places: an example with
    // `insteadOf` belongs to the "What to use instead" section, not the gallery.
    ...countExamples(await loadExamples(component.slug)),
  }
}

function isAlternative(example: ComponentExample) {
  return example.insteadOf !== undefined
}

function countExamples(examples: ComponentExample[]) {
  const gallery = examples.filter((e) => !isAlternative(e))
  return {
    exampleCount: gallery.length,
    // Which of them are drawn without the gallery's card, so the skeleton
    // draws the same shape: a card outline that vanishes when the table it was
    // standing in for arrives is the jump the skeleton exists to prevent.
    exampleFrames: gallery.map((e) => e.frame ?? "card"),
    alternativeCount: examples.length - gallery.length,
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
 * What the build writes for this route is the resolved gallery, inline, inside
 * the boundary's `<!--$-->` markers, where the fallback would otherwise be —
 * `grep 'data-slot="card"' build/client/components/badge/index.html` finds the
 * example cards. That is not React's default and it is not free: the two
 * settings that buy it are in `src/lib/document-shape.ts`, and until task #200
 * this page shipped its gallery in a `<div hidden>` at the end of the document
 * with a skeleton in its place.
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
      const examples = (await loadExamples(slug)).filter((e) => !isAlternative(e))
      return { default: () => <ExampleList examples={examples} /> }
    })
    galleries.set(slug, Gallery)
  }
  return Gallery
}

/**
 * The same treatment for the examples that show what to use instead. Same
 * chunk as the gallery — `loadExamples` resolves one module per slug — but its
 * own boundary, because it is its own section with its own heading above it.
 */
const alternativeLists = new Map<string, ComponentType>()

function alternativesFor(slug: string): ComponentType {
  let Alternatives = alternativeLists.get(slug)
  if (!Alternatives) {
    Alternatives = lazy(async () => {
      const examples = (await loadExamples(slug)).filter(isAlternative)
      return { default: () => <AlternativeList examples={examples} /> }
    })
    alternativeLists.set(slug, Alternatives)
  }
  return Alternatives
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
          {/* One boundary per example, inside its frame. An example that
              reaches for something of its own — a lazily imported chart, a
              resource read with `use()` — blanks its own box and leaves its
              heading, its description and the fourteen examples around it
              alone. Without it the first example to suspend takes the whole
              gallery back to the fallback. */}
          {example.frame === "none" ? (
            // No card: the example is a surface itself, or belongs on the page
            // rather than in a panel, and a frame would be a box round a box.
            <div className="mt-4">
              <Suspense fallback={<ExampleBodySkeleton index={index} />}>
                {example.render()}
              </Suspense>
            </div>
          ) : (
            <Card className="mt-4 min-h-30 items-center justify-center p-8">
              <Suspense fallback={<ExampleBodySkeleton index={index} />}>
                {example.render()}
              </Suspense>
            </Card>
          )}
        </div>
      ))}
    </>
  )
}

/**
 * Each alternative beside the thing it replaces. Deliberately not framed in the
 * gallery's Card: the "instead" half is shown on the page background, which is
 * where it would sit in an app — and a card drawn inside a card is the first
 * thing this section tells you not to do.
 */
function AlternativeList({ examples }: { examples: ComponentExample[] }) {
  return (
    <>
      {examples.map((example, index) => (
        <div key={example.title}>
          <h3 className="text-base font-semibold text-quebi-fg">{example.title}</h3>
          {example.description && (
            <p className="mt-1 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
              {example.description}
            </p>
          )}
          {/* min-w-0: a grid item defaults to its content's min width, so a
              table in one half would push the page sideways on a phone. */}
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="min-w-0">
              <span className="quebi-eyebrow">Instead of</span>
              <div className="mt-3 opacity-70">
                <Suspense fallback={<ExampleBodySkeleton index={index} />}>
                  {example.insteadOf?.()}
                </Suspense>
              </div>
            </div>
            <div className="min-w-0">
              <span className="quebi-eyebrow">Use</span>
              <div className="mt-3">
                <Suspense fallback={<ExampleBodySkeleton index={index} />}>
                  {example.render()}
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * The usage lines are written for llms.txt as much as for this page, so a name
 * to type is in backticks. Here that is inline code rather than two stray
 * characters. Odd segments of a split on the backtick are the code.
 */
function WithCode({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, index) =>
        // biome-ignore lint/suspicious/noArrayIndexKey: segments of one fixed string; their position is their identity.
        index % 2 === 1 ? <Code key={index}>{part}</Code> : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  )
}

/** When to use, when not to — straight from the metadata, so part of the frame. */
function UsageGuidance({ name, usage }: { name: string; usage: ComponentUsage }) {
  return (
    <div className="mt-12 grid gap-8 md:grid-cols-2">
      <div>
        <h2 className="text-lg font-semibold text-quebi-fg">Use a {name.toLowerCase()} when</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-quebi-fg-muted">
          {usage.when.map((line) => (
            <li key={line}>
              <WithCode text={line} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-quebi-fg">Don't</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-quebi-fg-muted">
          {usage.whenNot.map((line) => (
            <li key={line}>
              <WithCode text={line} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** The alternatives by job, as a table of links. Also from the metadata. */
function AlternativeTable({ usage }: { usage: ComponentUsage }) {
  return (
    <DescriptionList className="mt-4 max-w-quebi-content">
      {usage.instead.map((group) => (
        <Fragment key={group.job}>
          <DescriptionTerm>{group.job}</DescriptionTerm>
          <DescriptionDetails>
            <ul className="flex flex-col gap-1">
              {group.use.map((alt) => (
                <li key={alt.name}>
                  {alt.slug ? (
                    <UiLink href={`/components/${alt.slug}`} className="font-medium">
                      {alt.name}
                    </UiLink>
                  ) : (
                    <span className="font-medium text-quebi-fg">{alt.name}</span>
                  )}
                  {alt.when && <span className="text-quebi-fg-muted"> — {alt.when}</span>}
                </li>
              ))}
            </ul>
          </DescriptionDetails>
        </Fragment>
      ))}
    </DescriptionList>
  )
}

export default function ComponentDetail({ loaderData }: Route.ComponentProps) {
  const { slug } = useParams()
  const component = slug ? metaRegistry.find((c) => c.slug === slug) : undefined

  if (!component) return null

  const Gallery = galleryFor(component.slug)
  const Source = sourceFor(component.slug)
  const Alternatives = alternativesFor(component.slug)

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

      {component.usage && <UsageGuidance name={component.name} usage={component.usage} />}

      <div className="mt-12 space-y-10">
        <Suspense fallback={<GallerySkeleton count={loaderData.exampleCount} frames={loaderData.exampleFrames} />}>
          <Gallery />
        </Suspense>
      </div>

      {component.usage && (
        <div className="mt-16">
          <h2 className="text-lg font-semibold text-quebi-fg">What to use instead</h2>
          <p className="mt-1 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
            By what the {component.name.toLowerCase()} was doing.
          </p>
          <AlternativeTable usage={component.usage} />
          <div className="mt-10 space-y-12">
            <Suspense fallback={<AlternativesSkeleton count={loaderData.alternativeCount} />}>
              <Alternatives />
            </Suspense>
          </div>
        </div>
      )}

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
