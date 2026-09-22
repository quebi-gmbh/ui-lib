/**
 * The one failure a static site with hash-named assets cannot design away, and
 * the shape of the recovery `src/lib/stale-deploy.ts` gives it.
 *
 * A deploy here replaces every hashed file at once, and GitHub Pages caches
 * every file — the HTML too — for ten minutes with no way to say otherwise. So
 * a visitor can hold a document that names chunks the origin has already
 * dropped: the page boots from cache and then the first lazy import 404s.
 * "TypeError: Failed to fetch dynamically imported module", on first load,
 * fixed by a refresh, which is exactly what the recovery does automatically.
 *
 * What is worth pinning is not that it reloads — it is the guarantee that makes
 * reloading safe to do without asking. A chunk can be missing because the
 * document is stale *or* because the deploy is broken, the failure is identical,
 * and the second one must not become a page that reloads forever. The mark in
 * sessionStorage carries the identity of the document that asked, which is what
 * separates "I asked a moment ago" from "someone asked, and here we are again",
 * and every case below is one of those two being told apart.
 *
 * The other half is what the reader sees while the new document is on its way:
 * a promise that never settles, so the Suspense fallback stays up. Rethrowing
 * would paint the route's error boundary — a red stack trace for a problem
 * already being fixed — for the moment before the reload commits.
 */
import { afterEach, beforeEach, expect, spyOn, test } from "bun:test"
import { importChunk, installStaleDeployRecovery } from "@/lib/stale-deploy"

/** Must match `ASKED` in the module: it is a wire format between documents. */
const ASKED = "quebi:stale-deploy-reload"

/** This document's mark, and one that is plainly some earlier document's. */
const here = String(Math.trunc(performance.timeOrigin))
const earlier = String(Math.trunc(performance.timeOrigin) - 1)

const missingChunk = () =>
  Promise.reject(
    new TypeError("Failed to fetch dynamically imported module: /assets/server-table.examples-X.js"),
  )

let reloads = 0
let reload: ReturnType<typeof spyOn<Location, "reload">>

beforeEach(() => {
  reloads = 0
  window.sessionStorage.removeItem(ASKED)
  reload = spyOn(window.location, "reload").mockImplementation(() => {
    reloads += 1
  })
})

afterEach(() => {
  reload.mockRestore()
  window.sessionStorage.removeItem(ASKED)
})

/**
 * Whether a promise is still unsettled a turn of the event loop later — the
 * only way to assert "never settles" in finite time, and enough of one: every
 * path in `importChunk` settles within a microtask or not at all.
 */
async function outcome(promise: Promise<unknown>): Promise<"resolved" | "rejected" | "waiting"> {
  return await Promise.race([
    promise.then(
      () => "resolved" as const,
      () => "rejected" as const,
    ),
    new Promise<"waiting">((resolve) => setTimeout(() => resolve("waiting"), 10)),
  ])
}

test("a chunk the deploy has dropped asks for a fresh document and keeps its fallback up", async () => {
  const pending = importChunk(missingChunk)

  expect(await outcome(pending)).toBe("waiting")
  expect(reloads).toBe(1)
  expect(window.sessionStorage.getItem(ASKED)).toBe(here)
})

test("a second stale chunk in the same document waits for the reload already asked for", async () => {
  expect(await outcome(importChunk(missingChunk))).toBe("waiting")
  expect(await outcome(importChunk(missingChunk))).toBe("waiting")

  expect(reloads).toBe(1)
})

test("a chunk still missing after a reload surfaces the error instead of reloading again", async () => {
  window.sessionStorage.setItem(ASKED, earlier)

  expect(await outcome(importChunk(missingChunk))).toBe("rejected")
  expect(reloads).toBe(0)
})

test("a chunk that loads clears the mark, so the next deploy is recoverable too", async () => {
  window.sessionStorage.setItem(ASKED, earlier)

  await expect(importChunk(() => Promise.resolve({ ok: true }))).resolves.toEqual({ ok: true })
  expect(window.sessionStorage.getItem(ASKED)).toBeNull()

  expect(await outcome(importChunk(missingChunk))).toBe("waiting")
  expect(reloads).toBe(1)
})

test("Vite's preload error reaches the same recovery, for the imports this repo does not write", async () => {
  installStaleDeployRecovery()

  // What `__vitePreload` dispatches when a route module or a vendor chunk fails
  // — cancelable, and rethrown afterwards because nothing cancels it.
  window.dispatchEvent(new Event("vite:preloadError", { cancelable: true }))

  expect(reloads).toBe(1)
  expect(window.sessionStorage.getItem(ASKED)).toBe(here)
})
