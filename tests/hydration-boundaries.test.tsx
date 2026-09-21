/**
 * What hydration does to a prerendered Suspense boundary.
 *
 * This site is `ssr: false` + `prerender()` over every route, and
 * `src/entry.server.tsx` picks `onAllReady`, so the HTML the build writes
 * contains the *resolved* gallery — every example rendered, inside the
 * boundary's `<!--$-->` markers. In the browser that page is hydrated with the
 * examples chunk not yet downloaded, so the boundary's child suspends again.
 *
 * The question that had to be answered before drawing any skeleton (task #197):
 * does React throw the prerendered markup away and paint the fallback over it?
 * Content → skeleton → content is worse than no skeleton at all, and it would
 * have meant fixing the boundary before making the fallback nicer.
 *
 * The answer is no, with one exception, and both halves are pinned here because
 * neither is obvious from reading the route and both decide how
 * `src/routes/components.$slug.tsx` is allowed to be shaped:
 *
 * - A boundary that is merely *still suspended* at hydration keeps its server
 *   HTML. React leaves it dehydrated and hydrates it when the lazy resolves.
 * - A boundary that is *re-rendered from above* while it is still dehydrated is
 *   taken over by the client, and then the fallback does replace the content.
 *   Nothing between the router and the gallery holds state that changes on its
 *   own today. Anything added there later — a layout that resolves something in
 *   an effect, a context that updates once on mount — turns every component
 *   page into the flash, and this test is where that shows up.
 *
 * Measured this way rather than in a throttled browser because the behaviour
 * belongs to React's reconciler, not to the network: a gate the test opens by
 * hand is the same suspension a slow connection produces, and it is the half a
 * browser run could not have pinned as a regression.
 */
import { describe, expect, test } from "bun:test"
import { act, type ComponentType, lazy, startTransition, Suspense, useState } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToReadableStream } from "react-dom/server"

const Content = () => <p data-testid="content">resolved gallery</p>
const Fallback = () => <p data-testid="fallback">skeleton</p>

/** The route's shape in miniature: synchronous frame, one lazy section under it. */
function Page({ Lazy, onBump }: { Lazy: ComponentType; onBump?: (bump: () => void) => void }) {
  const [bumped, setBumped] = useState(false)
  onBump?.(() => setBumped(true))
  return (
    <div>
      <h1 data-testid="frame">{bumped ? "frame, updated" : "frame"}</h1>
      <Suspense fallback={<Fallback />}>
        <Lazy />
      </Suspense>
    </div>
  )
}

/** The HTML the build writes: `onAllReady`, so the boundary is resolved in it. */
async function prerender() {
  const Resolved = lazy(async () => ({ default: Content }))
  const stream = await renderToReadableStream(<Page Lazy={Resolved} />)
  await stream.allReady
  return await new Response(stream).text()
}

/** A lazy that stays pending until the returned `resolve` is called. */
function gatedLazy() {
  let open!: () => void
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  const Lazy = lazy(async () => {
    await gate
    return { default: Content }
  })
  return { Lazy, resolve: open, gate }
}

async function hydrateInto(html: string, element: React.ReactElement) {
  const container = document.createElement("div")
  container.innerHTML = html
  document.body.appendChild(container)
  await act(async () => {
    // `startTransition` is what `src/entry.client.tsx` wraps hydrateRoot in.
    startTransition(() => {
      hydrateRoot(container, element)
    })
  })
  return container
}

const has = (container: HTMLElement, testId: string) =>
  container.querySelector(`[data-testid="${testId}"]`) !== null

describe("a prerendered boundary whose chunk has not arrived", () => {
  test("keeps its content — the fallback never paints over it", async () => {
    const html = await prerender()
    expect(html).toContain("resolved gallery")

    const { Lazy, resolve, gate } = gatedLazy()
    const container = await hydrateInto(html, <Page Lazy={Lazy} />)

    // Still suspended: the server's markup is exactly where it was.
    expect(has(container, "content")).toBe(true)
    expect(has(container, "fallback")).toBe(false)

    await act(async () => {
      resolve()
      await gate
    })

    expect(has(container, "content")).toBe(true)
    expect(has(container, "fallback")).toBe(false)
    container.remove()
  })

  test("loses it to the fallback if an ancestor re-renders first", async () => {
    const html = await prerender()

    const { Lazy, resolve, gate } = gatedLazy()
    let bump: (() => void) | undefined
    const container = await hydrateInto(
      html,
      <Page
        Lazy={Lazy}
        onBump={(fn) => {
          bump = fn
        }}
      />,
    )
    expect(has(container, "content")).toBe(true)

    // An update above the boundary, while it is still dehydrated: React can no
    // longer reuse the server HTML, so it client-renders the boundary — and the
    // client render is the one that suspends.
    await act(async () => {
      bump?.()
    })

    expect(container.querySelector('[data-testid="frame"]')?.textContent).toBe("frame, updated")
    expect(has(container, "content")).toBe(false)
    expect(has(container, "fallback")).toBe(true)

    await act(async () => {
      resolve()
      await gate
    })

    expect(has(container, "content")).toBe(true)
    container.remove()
  })
})
