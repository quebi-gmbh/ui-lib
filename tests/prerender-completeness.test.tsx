/**
 * Where a resolved Suspense boundary's content ends up in the written HTML.
 *
 * The site prerenders every route so each page ships complete content for a
 * reader that does not execute it. React will happily write a page where that
 * is false: the fallback sits in the content position behind a `<!--$?-->`
 * marker and the real content is appended at the end of the document in a
 * `<div hidden id="S:n">`, with a `$RC("B:n","S:n")` call to swap them when the
 * parser reaches it. That is correct for a browser and useless for everything
 * else, and it is what this site shipped for all 154 component pages until
 * task #200 — the gallery and the baked source block both.
 *
 * `src/lib/document-shape.ts` holds the two settings that stop it, and the
 * argument for each. This is the half of the check that runs in CI. It is a
 * proxy: the real question is about a file in `build/client`, and nothing in CI
 * builds the site, so `scripts/check-prerender.ts` asks it directly as the last
 * step of `bun run build`. What is pinned here is the thing that would break
 * it — that both settings are in `src/entry.server.tsx`, and that both are
 * load-bearing.
 *
 * The second half is why the fixture's boundary is deliberately large. The
 * first attempt at this fix set only `onAllReady` and changed nothing that
 * mattered: React outlines a boundary that has *already resolved* if its
 * content would push the flush past `progressiveChunkSize`, whose default is
 * 12800 bytes, and a component gallery is tens of kilobytes. A fixture with a
 * small boundary passes under either setting and would have called that fix
 * done.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "bun:test"
import { lazy, Suspense } from "react"
import type { RenderToReadableStreamOptions } from "react-dom/server"
import { renderToReadableStream } from "react-dom/server"
import { completeDocument } from "../src/lib/document-shape"

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src")

/** React's default `progressiveChunkSize`: above this a resolved boundary is outlined. */
const DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12_800

const CONTENT_MARKER = "an example nobody should have to run a script to read"
const AFTER_MARKER = "the section below the gallery"

/**
 * A boundary the size of a real gallery rather than the size of a fixture:
 * comfortably over the default chunk size, so the `progressiveChunkSize` half
 * of the fix is exercised and not merely present.
 */
const FILLER = "gallery content ".repeat(60)
const EXAMPLES = Array.from({ length: 20 }, (_, index) => `example ${index}`)

function Gallery() {
  return (
    <div>
      <p>{CONTENT_MARKER}</p>
      {EXAMPLES.map((example) => (
        <p key={example}>
          {example} {FILLER}
        </p>
      ))}
    </div>
  )
}

/** The route's shape in miniature: a synchronous frame, one lazy section under it. */
const LazyGallery = lazy(async () => ({ default: Gallery }))

function Page() {
  return (
    <div>
      <h1>frame</h1>
      <Suspense fallback={<p>skeleton</p>}>
        <LazyGallery />
      </Suspense>
      <p>{AFTER_MARKER}</p>
    </div>
  )
}

/**
 * The document, written the way `src/entry.server.tsx` writes one: nothing is
 * read out of the stream until every boundary has resolved, which is what
 * `onAllReady` does for the pipeable stream the entry actually uses. (The entry
 * itself cannot be imported here — `react-dom`'s Bun build has no
 * `renderToPipeableStream` — which is why the settings live in their own
 * module.)
 */
async function prerender(options?: RenderToReadableStreamOptions) {
  const stream = await renderToReadableStream(<Page />, options)
  await stream.allReady
  return await new Response(stream).text()
}

describe("a prerendered page's lazy sections", () => {
  test("are written where their fallback was, not appended to the document", async () => {
    const html = await prerender({
      progressiveChunkSize: completeDocument.progressiveChunkSize,
    })

    expect(html).not.toContain("<!--$?-->")
    expect(html).not.toContain('<div hidden id="S:')
    expect(html).not.toContain("$RC(")
    expect(html).not.toContain("skeleton")

    expect(html).toContain(CONTENT_MARKER)
    expect(html.indexOf(CONTENT_MARKER)).toBeLessThan(html.indexOf(AFTER_MARKER))
  })

  test("are appended, behind a fallback, without the settings that stop it", async () => {
    const html = await prerender()

    // The control, and the regression in one assertion: this is the page the
    // build wrote before task #200. It is here so the test above is known to be
    // testing the settings rather than describing React's defaults back to
    // itself — if React ever stops deferring a resolved boundary on its own,
    // this fails and the comment in `src/lib/document-shape.ts` needs rewriting
    // rather than the settings needing keeping.
    expect(html).toContain('<div hidden id="S:0">')
    expect(html).toContain("$RC(")
    expect(html).toContain("skeleton")
    expect(html.indexOf(CONTENT_MARKER)).toBeGreaterThan(html.indexOf(AFTER_MARKER))
  })

  test("have a boundary larger than the chunk size the default would outline at", () => {
    // Guards the fixture, not the app. Shrink the gallery below the default and
    // both tests above still pass, for a reason that has nothing to do with
    // either setting.
    expect(FILLER.length * EXAMPLES.length).toBeGreaterThan(DEFAULT_PROGRESSIVE_CHUNK_SIZE)
  })
})

describe("src/entry.server.tsx", () => {
  const entry = readFileSync(join(SRC, "entry.server.tsx"), "utf8")

  test("waits for the whole tree before writing", () => {
    expect(completeDocument.readyOption).toBe("onAllReady")
    expect(entry).toContain("[completeDocument.readyOption]")
  })

  test("passes the chunk size that keeps a resolved boundary in place", () => {
    expect(completeDocument.progressiveChunkSize).toBe(Number.POSITIVE_INFINITY)
    expect(entry).toContain("progressiveChunkSize: completeDocument.progressiveChunkSize")
  })
})
