/**
 * What a page does when it outlives the assets it names.
 *
 * This site is static, hash-named and deployed whole: `react-router build`
 * writes `assets/<name>-<hash>.js`, every page names the hashes it needs, and
 * `deploy.yml` uploads `build/client` as one artifact that *replaces* the last
 * one — so the moment a deploy lands, every hash from the deploy before it is
 * a 404. GitHub Pages serves every file it holds, the HTML included, with
 * `cache-control: max-age=600` and offers no way to say otherwise: no headers
 * file, no `immutable` for the hashed assets, no per-path rule. For ten minutes
 * after a deploy, then, a visitor can be handed a document from before it —
 * by their own HTTP cache, or by the CDN in front of Pages — whose hashes the
 * origin no longer has.
 *
 * Such a document still *boots*, which is why this reads as a mystery rather
 * than as a stale page: the chunks booting needs are the ones the same cache
 * already holds, so the site paints. What fails is the first chunk that has to
 * come off the network — a component page's gallery, imported when the page
 * renders rather than when it was cached — and it fails as "Failed to fetch
 * dynamically imported module" from inside a `React.lazy`, which takes the
 * whole page down to the route error boundary. Refreshing fixes it, because a
 * refresh revalidates the document and the fresh one names chunks that exist.
 *
 * That is also the whole fix, and its shape: the running document is the stale
 * thing, so there is nothing it can do to itself. Fetch a new one.
 *
 * Doing that automatically needs exactly one guarantee — that a chunk which is
 * genuinely missing (a broken build, a half-uploaded deploy) cannot become a
 * reload loop. `ASKED` is that guarantee. It records *which document* asked for
 * the reload, so the three cases separate cleanly:
 *
 * - nothing recorded — nobody has asked yet. Reload.
 * - this document's own mark — we asked a moment ago, for some other chunk.
 *   Keep waiting; the new document is already on its way.
 * - another document's mark — a reload was tried and here we are again with
 *   the same failure. Stop, and let the error be seen: staleness is not the
 *   problem, and a second reload would only hide a broken deploy behind a
 *   flashing page.
 *
 * `importChunk` clears the mark on the first chunk that does load, so a session
 * that recovered can recover again when the next deploy lands underneath it —
 * which on this repo, where every push to `main` deploys, is a tab left open
 * for an afternoon.
 *
 * None of it runs at prerender. In Node there is no `window`, `sessionStore`
 * returns `undefined`, and `importChunk` is a plain `await` — which matters
 * because `components.$slug`'s loader counts a component's examples by calling
 * `loadExamples` at build time.
 */

/** sessionStorage key: the document that last asked for a stale-deploy reload. */
const ASKED = "quebi:stale-deploy-reload"

/**
 * `window.sessionStorage`, or `undefined` where there is none: Node at
 * prerender, and the handful of browser contexts (a sandboxed iframe, storage
 * switched off) that throw on the property access rather than returning null.
 */
function sessionStore(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage
  } catch {
    return undefined
  }
}

/** This document's identity: the epoch millisecond its navigation started. */
function documentMark(): string {
  return String(Math.trunc(performance.timeOrigin))
}

/**
 * Ask for a fresh document, and answer whether one is coming.
 *
 * `true` means the caller should keep waiting rather than surface its error —
 * either because this call started the reload or because an earlier failure in
 * the same document already did.
 */
function requestReload(): boolean {
  const store = sessionStore()
  if (!store) {
    // No storage, so no record of who asked — fall back to the navigation type,
    // which cannot say *what* was retried but does say whether this document is
    // itself the product of a reload. Coarser (one attempt per document rather
    // than one per failure), and it keeps the no-loop guarantee.
    const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
    if (navigation?.type === "reload") return false
    window.location.reload()
    return true
  }

  const asked = store.getItem(ASKED)
  if (asked === documentMark()) return true
  if (asked !== null) return false

  store.setItem(ASKED, documentMark())
  window.location.reload()
  return true
}

/**
 * A promise that never settles, for a caller whose document is on its way out.
 *
 * The alternative is to rethrow and let the reader have the error boundary for
 * the moment before the reload commits — a red stack trace for a problem that
 * is already being fixed. Holding the Suspense fallback up says the true thing
 * instead: this is still coming.
 */
function neverSettles<T>(): Promise<T> {
  return new Promise<T>(() => {
    // Deliberately empty: the document is being replaced.
  })
}

/**
 * Await a lazily imported chunk, recovering from a stale document instead of
 * handing the reader a stack trace.
 *
 * Every `import.meta.glob` loader in `src/registry/*-lazy.ts` goes through here;
 * `installStaleDeployRecovery` covers the dynamic imports this repo does not
 * write itself (react-router's route modules, OverlayScrollbars).
 */
export async function importChunk<T>(load: () => Promise<T>): Promise<T> {
  try {
    const chunk = await load()
    sessionStore()?.removeItem(ASKED)
    return chunk
  } catch (error) {
    if (requestReload()) return neverSettles<T>()
    throw error
  }
}

/**
 * Listen for the failure of any dynamic import Vite compiled, from
 * `src/entry.client.tsx`.
 *
 * Vite's preload helper dispatches `vite:preloadError` synchronously and then
 * rethrows unless the event was cancelled. We let it rethrow: the throw is what
 * `importChunk` reads, and swallowing it would resolve the import with
 * `undefined` for every caller that is not this module's.
 */
export function installStaleDeployRecovery(): void {
  window.addEventListener("vite:preloadError", () => {
    requestReload()
  })
}
