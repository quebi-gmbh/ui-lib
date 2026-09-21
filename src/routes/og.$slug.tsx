import { MotionGlobalConfig } from "motion/react"
import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { metaRegistry } from "@/registry/meta"
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

/**
 * The same instruction for everything CSS drives.
 *
 * A popover fades and zooms in over about 200ms, and this page declares itself
 * ready after four frames — so every overlay was being photographed, and
 * measured, somewhere in the middle of its entrance. Playwright fast-forwards
 * animations for the *screenshot*, which hid the half of it that matters here:
 * `magnifyOverlays` measures where a surface ended up, and `scripts/og-audit.ts`
 * measures how big its text came out, and both of them were reading a frame of
 * an animation rather than the picture. Zero duration is the end state, on the
 * first frame, for the photograph and the tape measure alike.
 */
const NO_CSS_ANIMATION = `*,*::before,*::after{
  animation-duration:0s!important;animation-delay:0s!important;
  transition-duration:0s!important;transition-delay:0s!important;
}`

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
 * Magnifies whatever the scene hung outside the stage.
 *
 * The stage magnifies with a transform, and a transform reaches exactly the
 * subtree it is written on. Every overlay in this library is portalled to
 * `document.body` — that is how a popover escapes an `overflow-hidden`
 * ancestor — so until task #202 a scene that opened one published a 1.8×
 * trigger sitting on top of a 1× listbox: 14px menu items in a picture read at
 * a third of its width, next to a label twice their size. Sixteen scenes were
 * half-magnified this way and no scene could fix it, because the half that was
 * wrong is not in the scene.
 *
 * So the magnification is applied a second time, to each portalled surface, by
 * hand. Three things make that come out where it should:
 *
 * - **A surface, not the portal.** The thing react-aria hangs on the body is
 *   usually a scrim the size of the canvas with the real surface inside it.
 *   Scaling the scrim would scale the darkness and leave the dialog alone, so
 *   anything that covers the whole canvas is descended into rather than scaled.
 * - **Anchored where it is attached.** react-aria has already placed the
 *   surface against the *scaled* trigger, so the origin has to be the point
 *   where the two touch — the popover's top edge at the trigger's middle — and
 *   the surface grows away from it. A surface that came out of a scrim was
 *   placed against the window instead of against anything on the canvas, so it
 *   grows about its own middle; and one pinned to an edge (a toast in its
 *   corner) keeps that edge whatever it was placed by.
 * - **And then moved onto the stage, if it fits.** A modal is centred on a
 *   *window*, and this canvas is not one: it has a logo across the top and the
 *   component's name across the bottom, and a dialog magnified about its own
 *   middle grows straight into both. An unpinned surface is nudged by the least
 *   it takes to sit between the bands — the smallest possible lie about where
 *   an overlay goes, told so that the picture has one subject instead of three
 *   overlapping ones.
 * - **Full-bleed is left alone.** A drawer spans the window's width and a
 *   sheet its height, on purpose, and both are driven by `motion`, which owns
 *   their transform and writes over anything put there. Those two scenes are
 *   the exemption `scripts/og-audit.ts` names: the picture is a panel across
 *   the edge of a window, and a magnified one is no longer that.
 *
 * Positions are approximate in a way real layout would not be: a popover
 * aligned to its trigger's start grows symmetrically about the trigger's
 * middle instead. That is visible only when a surface is much wider than what
 * opened it, and the alternative — portalling into the scaled subtree — puts
 * react-aria's viewport-space arithmetic through the scale twice.
 */
function magnifyOverlays(scale: number) {
  if (scale === 1) return
  const root = document.querySelector("[data-og-slug]")
  const scene = document.querySelector("[data-og-scene]")
  const stage = document.querySelector("[data-og-stage]")
  if (!(root instanceof HTMLElement) || !(stage instanceof HTMLElement)) return

  const canvas = root.getBoundingClientRect()
  const stageBox = stage.getBoundingClientRect()
  const sceneBox = (scene ?? root).getBoundingClientRect()

  /** How close to an edge counts as pinned to it, in the surface's own pixels. */
  const EDGE = 24

  /**
   * How far inside the stage a nudged surface lands. A pixel more than the
   * margin `scripts/og-audit.ts` measures with, so that a surface moved to
   * satisfy the check is not left sitting exactly on the number.
   */
  const INSET = 12

  const covers = (rect: DOMRect) =>
    rect.width >= canvas.width - EDGE && rect.height >= canvas.height - EDGE

  // `viaScrim` is how a surface says what placed it: anything reached by
  // descending through a canvas-sized layer was positioned against the window,
  // not against a trigger the reader can see.
  const surfaces: { element: HTMLElement; viaScrim: boolean }[] = []
  const collect = (element: Element, viaScrim: boolean) => {
    const rect = element.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2 || covers(rect)) {
      const inScrim = viaScrim || covers(rect)
      for (const child of Array.from(element.children)) collect(child, inScrim)
      return
    }
    if (element instanceof HTMLElement) surfaces.push({ element, viaScrim })
  }
  for (const child of Array.from(document.body.children)) {
    if (child === root || child.tagName === "SCRIPT" || child.tagName === "STYLE") continue
    collect(child, false)
  }

  for (const { element: surface, viaScrim } of surfaces) {
    const rect = surface.getBoundingClientRect()
    // A surface the window placed keeps the place the window gave it, and grows
    // about its own middle; one a trigger placed grows away from the trigger.
    const anchor = viaScrim ? rect : sceneBox
    const spansX = rect.left <= EDGE && rect.right >= canvas.width - EDGE
    const spansY = rect.top <= EDGE && rect.bottom >= canvas.height - EDGE
    if (spansX || spansY) continue

    const originOf = (near: number, far: number, at: number, limit: number) => {
      const size = far - near
      if (near <= EDGE && far >= limit - EDGE) return size / 2
      if (near <= EDGE) return 0
      if (far >= limit - EDGE) return size
      return Math.min(Math.max(at - near, 0), size)
    }
    const x = originOf(rect.left, rect.right, anchor.left + anchor.width / 2, canvas.width)
    const y = originOf(rect.top, rect.bottom, anchor.top + anchor.height / 2, canvas.height)

    surface.style.transformOrigin = `${Math.round(x)}px ${Math.round(y)}px`
    surface.style.transform = `scale(${scale})`

    const pinned =
      rect.left <= EDGE ||
      rect.right >= canvas.width - EDGE ||
      rect.top <= EDGE ||
      rect.bottom >= canvas.height - EDGE
    if (!viaScrim || pinned) continue

    /** The least you can move [near, far] to land it inside [min, max]. */
    const shift = (near: number, far: number, min: number, max: number) => {
      if (far - near > max - min) return 0
      if (near < min) return min - near
      if (far > max) return max - far
      return 0
    }
    const grown = surface.getBoundingClientRect()
    const dx = shift(grown.left, grown.right, stageBox.left + INSET, stageBox.right - INSET)
    const dy = shift(grown.top, grown.bottom, stageBox.top + INSET, stageBox.bottom - INSET)
    if (dx !== 0 || dy !== 0) {
      surface.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(${scale})`
    }
  }
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
 *
 * `magnifyOverlays` goes in the middle of that sequence rather than in an
 * effect of its own: it measures where react-aria put a surface, so it has to
 * run after the overlay has been placed, and it moves the picture, so it has to
 * run before the two frames the shutter waits on.
 */
function useOgReady(scale: number) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const settle = async () => {
      await document.fonts.ready
      await frames(2)
      await new Promise((resolve) => setTimeout(resolve, 0))
      magnifyOverlays(scale)
      await frames(2)
      if (!cancelled) setReady(true)
    }
    void settle()

    return () => {
      cancelled = true
    }
  }, [scale])

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
  const component = slug ? metaRegistry.find((c) => c.slug === slug) : undefined
  const scene = slug ? ogScenes[slug] : undefined
  const scale = scene?.scale ?? 1.5
  const ready = useOgReady(scale)

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
      {/* In the body rather than the head: it has to reach the overlays this
          route portals out of itself, and this is a screenshot canvas, not a
          document anyone will read the metadata of. */}
      <style>{NO_CSS_ANIMATION}</style>
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
        // The box a scene has to fit inside, named so `scripts/audit-og.ts` can
        // measure against it rather than against a number copied out of here.
        data-og-stage=""
        className={`relative z-10 flex flex-1 justify-center overflow-hidden px-16 ${
          // `pt-3` only when top-aligned: `items-start` otherwise puts the
          // scene's first pixel on the stage's own edge, which reads as a
          // trigger stuck to the band above it — and is what the audit's margin
          // is for.
          scene?.align === "top" ? "items-start pt-3" : "items-center"
        }`}
      >
        {scene ? (
          <div
            data-og-scene=""
            // The stage magnifies rather than the scene declaring its own type
            // scale: a scene is written at the size the component really is, so
            // it stays a piece of ordinary app code, and the one number that
            // makes it readable as a thumbnail sits here.
            style={{
              transform: `scale(${scale})`,
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
