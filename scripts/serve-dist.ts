/**
 * The built site, served the way GitHub Pages serves it: real files where they
 * exist, the SPA fallback everywhere else. `/og/<slug>` is deliberately not
 * prerendered, so it arrives through that fallback and hydrates client-side —
 * which is the whole reason the share images need a browser and not a renderer.
 *
 * A prerendered page is a directory with an `index.html` in it, and Pages
 * serves that file for the directory's path, so this does too. `Bun.file` on a
 * directory reports that it exists and then serves nothing, which is why the
 * candidates are checked with `stat` rather than `exists()`.
 *
 * Shared by the two scripts that drive a browser over `build/client`:
 * `screenshot-og.ts` and `hidden-input-scroll.ts`.
 */
import { stat } from "node:fs/promises"
import { join, normalize } from "node:path"

async function isFile(path: string): Promise<boolean> {
  return (await stat(path).catch(() => null))?.isFile() ?? false
}

export function serveDist(root: string) {
  return Bun.serve({
    port: 0,
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname)
      const path = join(root, normalize(pathname))
      for (const candidate of [path, join(path, "index.html")]) {
        if (await isFile(candidate)) return new Response(Bun.file(candidate))
      }
      const fallback = Bun.file(join(root, "__spa-fallback.html"))
      if (await fallback.exists()) {
        return new Response(fallback, { headers: { "content-type": "text/html; charset=utf-8" } })
      }
      return new Response("Not found", { status: 404 })
    },
  })
}
