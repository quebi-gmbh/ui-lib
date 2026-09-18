import { MotionGlobalConfig } from "motion/react"
import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getComponent } from "@/registry"
import { ogScenes } from "@/registry/og"

/**
 * The share image, as a page.
 *
 * `/og/<slug>` renders one component's OG scene inside the quebi card frame at
 * exactly 1200×630, and `scripts/screenshot-og.ts` photographs it in the deploy
 * build. Nothing else links here: the route exists so that the frame is real
 * React and real quebi tokens — editable in the dev server, themed by the same
 * stylesheet as the site, and visible while a scene is being composed — instead
 * of a second description of the design in a satori object literal.
 *
 * It is deliberately absent from `prerender()` in react-router.config.ts and
 * from the sitemap: 152 more HTML files on a static host to serve a build step
 * is a cost with no reader. The Pages SPA fallback hydrates it client-side,
 * which is all the screenshot needs.
 */

/**
 * Every motion animation jumps straight to its end state.
 *
 * Playwright's screenshot already fast-forwards CSS animations and transitions,
 * and `prefers-reduced-motion: reduce` already reaches the code that asks — but
 * `motion` drives Drawer's scrim and Navbar's indicator from JavaScript, which
 * neither of those touches. Without this the shutter can open while a scrim is
 * a third of the way to opaque, and the same commit photographs two different
 * pictures depending on how warm the font cache was.
 */
MotionGlobalConfig.skipAnimations = true

/** The OG spec's canvas. Not a design token — the size is the format. */
const OG_WIDTH = 1200
const OG_HEIGHT = 630

/**
 * The card for `/og/default`, the site-wide fallback `seo()` points every page
 * at that sets no image of its own. It is the one slug with no component behind
 * it, so it is the one card that is only ever the frame.
 */
const SITE_CARD = {
  eyebrow: "React component library",
  title: "ui-lib",
  subtitle: "Copy-paste source, no install required.",
}

export function meta() {
  // A screenshot canvas, not a page. Reachable through the SPA fallback, so say
  // so rather than relying on it being unlinked.
  return [{ title: "quebi ui-lib — share image" }, { name: "robots", content: "noindex" }]
}

/** Resolves after `count` painted frames. */
function frames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let left = count
    const tick = () => (left-- > 0 ? requestAnimationFrame(tick) : resolve())
    tick()
  })
}

/**
 * Flips `data-og-ready` once the picture has stopped changing.
 *
 * Three things have to have happened. The web fonts have to have resolved —
 * Outfit arrives over the network, and a card set in the fallback stack is a
 * different image. The charts have to have measured themselves: a recharts
 * container is sized by a ResizeObserver, so its first paint is at a size it
 * has not been told yet, and the real one lands a frame or two later. And React
 * has to have flushed whatever that measurement scheduled, which is why there
 * is a macrotask in the middle rather than five frames in a row.
 *
 * A signal rather than a sleep — a fixed wait is either too short on a cold
 * cache or wasted 152 times over. The frames here are the tail of the signal,
 * not the signal: without them one chart in a hundred and fifty-three came out
 * a sub-pixel different on the second run of the same commit.
 */
function useOgReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const settle = async () => {
      await document.fonts.ready
      await frames(2)
      await new Promise((resolve) => setTimeout(resolve, 0))
      await frames(2)
      if (!cancelled) setReady(true)
    }
    void settle()

    return () => {
      cancelled = true
    }
  }, [])

  return ready
}

/**
 * The type step the name fits on. "Conform Async Multiple Select" is twenty-nine
 * characters and runs off the canvas at the size "Badge" wants — and a name that
 * has run off the edge is the one thing this image cannot get wrong, because it
 * is the only place the component is named.
 */
function titleSize(title: string) {
  if (title.length > 22) return "text-5xl"
  if (title.length > 15) return "text-6xl"
  return "text-7xl"
}

export default function OgImage() {
  const { slug } = useParams()
  const component = slug ? getComponent(slug) : undefined
  const scene = slug ? ogScenes[slug] : undefined
  const ready = useOgReady()

  const eyebrow = component?.category ?? SITE_CARD.eyebrow
  const title = component?.name ?? SITE_CARD.title
  const subtitle = component?.description ?? SITE_CARD.subtitle

  return (
    <div
      data-og-ready={ready ? "true" : undefined}
      data-og-slug={slug}
      // The one place in the app that is measured in pixels rather than in
      // tokens: this box *is* the file the screenshot writes.
      style={{ width: OG_WIDTH, height: OG_HEIGHT }}
      className="relative flex flex-col overflow-hidden bg-quebi-bg text-quebi-fg"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-quebi-grid" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-quebi-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-20 size-80 rounded-full bg-quebi-accent/20 blur-3xl"
      />

      {/* z-60, not z-10: a scene that opens a modal, a sheet or a drawer paints
          a scrim across the whole viewport at z-50, and the one thing this
          image cannot afford to lose behind it is the component's name. */}
      <div className="relative z-60 flex items-center justify-between px-16 pt-14">
        <img src="/quebi-logo.svg" alt="quebi" width={173} height={50} />
        <span className="text-xl font-medium uppercase tracking-widest text-quebi-brand">
          {eyebrow}
        </span>
      </div>

      <div
        className={`relative z-10 flex flex-1 justify-center overflow-hidden px-16 ${
          scene?.align === "top" ? "items-start" : "items-center"
        }`}
      >
        {scene ? (
          <div
            // The stage magnifies rather than the scene declaring its own type
            // scale: a scene is written at the size the component really is, so
            // it stays a piece of ordinary app code, and the one number that
            // makes it readable as a thumbnail sits here.
            style={{
              transform: `scale(${scene.scale ?? 1.5})`,
              // A scene magnified about its middle grows upwards too, which a
              // top-aligned one cannot afford: it is up there to leave room
              // below for an overlay.
              transformOrigin: scene.align === "top" ? "top center" : "center",
            }}
            className="flex items-center justify-center"
          >
            {scene.render()}
          </div>
        ) : (
          <p className="w-full text-3xl leading-snug text-quebi-fg-muted">{subtitle}</p>
        )}
      </div>

      <div className="relative z-60 px-16 pb-14">
        <p className={`${titleSize(title)} font-bold leading-none tracking-tight text-quebi-fg`}>
          {title}
        </p>
      </div>
    </div>
  )
}
