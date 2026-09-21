import type { RenderToPipeableStreamOptions } from "react-dom/server"

/**
 * The two settings that make a prerendered page a page rather than a transcript
 * of one being streamed.
 *
 * They live here, apart from `src/entry.server.tsx`, for one reason: that file
 * imports `renderToPipeableStream`, which `react-dom`'s Bun build does not
 * export, so `bun test` cannot load it. The guarantee these two values buy is
 * worth a test in CI — the only other place it is observable is the built HTML,
 * and nothing builds the site until `deploy.yml` runs on `main`, which is after
 * the merge. `tests/prerender-completeness.test.tsx` imports them from here,
 * renders a boundary through them, and checks the result is what the built page
 * needs to be.
 *
 * Both are about *where in the file* a resolved boundary's content ends up, and
 * either one alone leaves it in the wrong place:
 *
 * - `readyOption` decides when React starts writing. `onShellReady` — the
 *   framework template's choice for a human reader — starts at the shell, so
 *   every boundary that has not resolved yet gets its fallback in the content
 *   position behind a `<!--$?-->` marker and its real content appended at the
 *   end of the document in a `<div hidden id="S:n">`, followed by a
 *   `$RC("B:n","S:n")` call that swaps the two. `onAllReady` waits for the
 *   whole tree first, so nothing is pending when writing starts.
 * - `progressiveChunkSize` decides what React does with a boundary that *has*
 *   resolved. Above the default 12800 bytes it outlines it anyway — same
 *   hidden div, same `$RC` — so that a reader watching the page fill does not
 *   wait on one large section. A component page's gallery is tens of
 *   kilobytes, so `onAllReady` on its own changed nothing for the sections
 *   that matter. `Infinity` makes the size test never fire: every resolved
 *   boundary is written inline, in document order, where its fallback would
 *   have been.
 *
 * A browser cannot tell the difference — it runs `$RC` as the parser reaches
 * it, so the DOM React hydrates is the same either way, and the hydration
 * behaviour pinned in `tests/hydration-boundaries.test.tsx` is unaffected.
 * Every reader that does not execute the page can: this site prerenders so that
 * each page ships complete content for SEO, social and AI readers, and a
 * skeleton where the gallery belongs is not that.
 */
export const completeDocument = {
  readyOption: "onAllReady",
  progressiveChunkSize: Number.POSITIVE_INFINITY,
} as const satisfies {
  readyOption: keyof RenderToPipeableStreamOptions
} & Pick<RenderToPipeableStreamOptions, "progressiveChunkSize">
