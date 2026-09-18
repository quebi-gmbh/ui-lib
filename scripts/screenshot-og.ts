/**
 * Photographs the share images.
 *
 * Serves `build/client`, opens `/og/<slug>` in Chromium at exactly 1200×630 for
 * every component plus the site default, waits for the page to say it has
 * stopped changing, and writes `build/client/og/<slug>.jpg`.
 *
 * Runs *after* `react-router build`, not before it: the images are photographs
 * of the built app. That is a reversal — satori needed nothing but a font file,
 * so `generate:og` ran first — and it costs nothing, because `og:image` is a
 * static path baked into the prerendered HTML and the file it points at only has
 * to exist by the time the artifact is uploaded.
 *
 *   bun run screenshot:og                    # serve build/client (the deploy path)
 *   bun run screenshot:og --base http://localhost:5173   # against `bun run dev`
 *   bun run screenshot:og --only badge,dialog            # while composing a scene
 *
 * This is the repo's only browser dependency — the test suite renders in
 * happy-dom — so the ways it can fail are handled here rather than left to
 * whoever next reads a red deploy: every wait is explicit, a page error is
 * reported with the slug that raised it, and one bad scene fails the build by
 * name instead of silently shipping a blank card.
 */
import { mkdir, rm } from "node:fs/promises"
import { dirname, join, normalize, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { metaRegistry } from "../src/registry/meta"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DIST = join(ROOT, "build/client")
const OUT = join(DIST, "og")

/** The OG canvas, and the same numbers the route draws itself at. */
const WIDTH = 1200
const HEIGHT = 630

/**
 * JPEG rather than PNG, at the quality where the difference stops being visible
 * on a dark UI screenshot. 153 lossless screenshots are 25–60 MB against the
 * 3.7 MB of text cards they replace, which is a lot of repository-sized payload
 * for an image that is displayed at a third of its size inside a chat client.
 * `src/lib/seo.ts` and `src/routes/components.$slug.tsx` name the extension.
 */
const QUALITY = 85

/** How long one scene may take to settle before it is called broken. */
const READY_TIMEOUT_MS = 30_000

function arg(name: string): string | undefined {
  const flag = `--${name}`
  const index = process.argv.indexOf(flag)
  if (index !== -1) return process.argv[index + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

/**
 * The built site, served the way GitHub Pages serves it: real files where they
 * exist, the SPA fallback everywhere else. `/og/<slug>` is deliberately not
 * prerendered, so it arrives through that fallback and hydrates client-side —
 * which is the whole reason this has to be a browser and not a renderer.
 */
function serveDist(root: string) {
  return Bun.serve({
    port: 0,
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname)
      const asset = Bun.file(join(root, normalize(pathname)))
      if (await asset.exists()) return new Response(asset)
      const fallback = Bun.file(join(root, "__spa-fallback.html"))
      if (await fallback.exists()) {
        return new Response(fallback, { headers: { "content-type": "text/html; charset=utf-8" } })
      }
      return new Response("Not found", { status: 404 })
    },
  })
}

async function main() {
  const only = arg("only")?.split(",").filter(Boolean)
  const slugs = ["default", ...metaRegistry.map((m) => m.slug)].filter(
    (slug) => !only || only.includes(slug),
  )

  const externalBase = arg("base")
  const server = externalBase ? undefined : serveDist(DIST)
  const base = externalBase ?? `http://localhost:${server?.port}`

  // A full run owns the directory; a `--only` run is someone iterating on one
  // scene and must not delete the other 152.
  if (!only) await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({
    // Chromium will happily rasterize the same DOM into two slightly different
    // images: work is split across raster threads and compositor stages, and
    // which tile lands when is a scheduling decision. The DOM here is identical
    // between runs — that was measured — and one chart in a hundred and fifty
    // still came out a sub-pixel different. These flags take the scheduling out
    // of it: draw every compositor stage before the frame is presented, do the
    // rasterizing on one thread, and stop the checkerboard placeholder pass
    // from ever standing in for content.
    args: [
      "--run-all-compositor-stages-before-draw",
      "--disable-new-content-rendering-timeout",
      "--disable-threaded-animation",
      "--disable-threaded-scrolling",
      "--disable-checker-imaging",
      "--disable-image-animation-resync",
      "--disable-partial-raster",
      "--disable-skia-runtime-opts",
      "--force-device-scale-factor=1",
      "--hide-scrollbars",
    ],
  })
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    // The image is a file, not a retina display: one CSS pixel, one pixel.
    deviceScaleFactor: 1,
    // Belt to the screenshot's braces — this one also reaches JS that asks.
    reducedMotion: "reduce",
    colorScheme: "dark",
  })
  const page = await context.newPage()

  // A scene that throws renders nothing, and nothing looks exactly like a scene
  // that has not finished. Keep the error so the timeout below can say which.
  let pageError: string | undefined
  page.on("pageerror", (error) => {
    pageError = error.message
  })

  const failures: string[] = []

  for (const slug of slugs) {
    pageError = undefined
    try {
      await page.goto(`${base}/og/${slug}`, { waitUntil: "load" })
      const canvas = page.locator('[data-og-ready="true"]')
      await canvas.waitFor({ state: "visible", timeout: READY_TIMEOUT_MS })
      await canvas.screenshot({
        path: join(OUT, `${slug}.jpg`),
        type: "jpeg",
        quality: QUALITY,
        // Fast-forwards CSS animations and transitions to their end state, so
        // an overlay caught mid-entrance is not a different image every run.
        animations: "disabled",
      })
    } catch (error) {
      const reason = pageError ?? (error as Error).message.split("\n")[0]
      failures.push(`${slug}: ${reason}`)
      console.error(`✗ ${slug} — ${reason}`)
    }
  }

  await browser.close()
  server?.stop(true)

  if (failures.length > 0) {
    console.error(`\n${failures.length} OG scene(s) failed:\n  ${failures.join("\n  ")}`)
    process.exit(1)
  }

  console.log(`Photographed ${slugs.length} OG images into build/client/og/`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
