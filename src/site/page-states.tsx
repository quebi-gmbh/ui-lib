import { Card } from "@/components/card"
import { Note } from "@/components/note"
import { Skeleton } from "@/components/skeleton"
import { cn } from "@/lib/utils"

/**
 * What a page section shows while it is loading, and what it shows when there
 * is nothing to load. Two different states, two different components — which is
 * the point of the module.
 *
 * The site's loading convention, in three sentences:
 *
 * 1. **The frame is synchronous.** Breadcrumb, eyebrow, title, description,
 *    badges, section headings and static prose come out of `metaRegistry` /
 *    `rulesRegistry`, which are plain data the route already holds. They paint
 *    on the first frame and are never inside a boundary.
 * 2. **One boundary per thing the reader is waiting for**, not one per chunk. A
 *    gallery of fifteen examples is fifteen units; its fallback is fifteen unit
 *    skeletons, so the stack is roughly the height the content will be and the
 *    scroll position does not jump when it arrives.
 * 3. **A fallback is never an empty state.** A pulse means "this is coming". If
 *    it is not coming, say so in words — {@link SourceUnavailable} — because a
 *    skeleton that never resolves is indistinguishable from a slow connection.
 *
 * The shapes live here rather than inline in the route because they are the
 * repo's answer to its own advice: `src/components/skeleton.tsx` says "compose
 * several skeletons to mirror the shape of the eventual content", and the site
 * used to answer that with a single `h-60` bar for a whole gallery. The same
 * compositions are published in `src/registry/skeleton.examples.tsx`, where a
 * consumer copying from `/api/components/skeleton.json` finds them.
 *
 * Nothing here is random. The widths cycle through a fixed list by index: the
 * site is prerendered, so a `Math.random()` width would bake one set of numbers
 * into the HTML and roll different ones at hydration.
 */

/** Deterministic variety: pick from `values` by index, wrapping. */
const cycle = <T,>(values: readonly T[], index: number) => values[index % values.length] as T

const TITLE_WIDTHS = ["w-40", "w-56", "w-48", "w-64"] as const
const DESCRIPTION_WIDTHS = ["w-3/4", "w-2/3", "w-5/6", "w-1/2"] as const
const BODY_HEIGHTS = ["h-16", "h-24", "h-20"] as const

/**
 * The example card's own waiting state — the box stays, its contents pulse.
 *
 * Used *inside* the Card rather than in place of it: by the time an individual
 * example suspends the gallery chunk has already arrived, so the heading,
 * description and card outline around it are real content and only the rendered
 * component is missing.
 */
export function ExampleBodySkeleton({ index = 0 }: { index?: number }) {
  return <Skeleton soft className={cn("w-full max-w-96", cycle(BODY_HEIGHTS, index))} />
}

/**
 * One unit of the gallery: heading bar, description line, card box — the shape
 * `ExampleList` renders for every entry in a component's examples file.
 */
export function ExampleCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div>
      <Skeleton className={cn("h-6", cycle(TITLE_WIDTHS, index))} />
      <Skeleton soft className={cn("mt-2 h-4", cycle(DESCRIPTION_WIDTHS, index))} />
      {/* The same Card the real example is rendered into, so the outline does
          not appear or move when the content lands. */}
      <Card className="mt-4 min-h-30 items-center justify-center p-8">
        <ExampleBodySkeleton index={index} />
      </Card>
    </div>
  )
}

/**
 * The gallery's waiting state: one {@link ExampleCardSkeleton} per example that
 * is coming.
 *
 * `count` is real — the route's loader counts the examples at prerender time
 * and ships the number in the page's data, so this is the shape of the answer
 * rather than a guess at it. Which also means zero is an answer: a gallery with
 * no examples renders nothing, so its fallback renders nothing, rather than
 * promising one card that will never arrive.
 *
 * A fragment, not a wrapper: the units are direct children of the route's
 * `space-y-10` stack, exactly like the real cards, so the two states space
 * themselves identically.
 */
export function GallerySkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the index *is* the identity here — these are n indistinguishable placeholders, and nothing reorders them.
        <ExampleCardSkeleton key={index} index={index} />
      ))}
    </>
  )
}

const CODE_LINE_WIDTHS = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-11/12", "w-1/3"] as const
const CODE_INDENTS = ["", "ml-4", "ml-4", "ml-8", "ml-4", ""] as const

/**
 * The baked-source block's waiting state: the code surface with lines in it.
 *
 * The Card and its `bg-quebi-bg` are `CodeBlock`'s, so the dark code surface is
 * there from the first frame and only the source arrives late.
 */
export function CodeBlockSkeleton({ lines = 12 }: { lines?: number }) {
  return (
    <Card className="gap-2.5 bg-quebi-bg p-5">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          soft
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder lines have no identity beyond their position.
          key={index}
          className={cn("h-3.5", cycle(CODE_INDENTS, index), cycle(CODE_LINE_WIDTHS, index))}
        />
      ))}
    </Card>
  )
}

/**
 * The source block's *empty* state — what a component with no baked source
 * module shows.
 *
 * It used to be `<Skeleton className="h-40" />`, the same shape the boundary
 * above it uses for "still loading", so a component whose source never made it
 * into the build pulsed forever and read exactly like a slow connection.
 */
export function SourceUnavailable({ slug }: { slug: string }) {
  return (
    <Note intent="warning" title="No source for this component yet">
      <p>
        The build did not bake a source module for <strong>{slug}</strong>. Nothing is loading —
        this is the whole answer. The raw file is still served at{" "}
        <code className="text-quebi-fg-subtle">/api/components/{slug}.tsx</code>.
      </p>
    </Note>
  )
}
