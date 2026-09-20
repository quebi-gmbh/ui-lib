import { useCallback, useEffect, useRef } from "react"
import type { OverlayScrollbars, PartialOptions } from "overlayscrollbars"

/**
 * The one options object every quebi overlay scrollbar is built from.
 *
 * `os-theme-quebi` lives in quebi-theme.css next to the `quebi-scrollbar`
 * utility the component library paints its own overflow containers with — the
 * two are the same track and pill, so a popover body and the page scrollbar
 * read as one system. Declaring it once is also what keeps the four site
 * surfaces from drifting apart from each other.
 */
const QUEBI_SCROLLBAR_OPTIONS: PartialOptions = {
  scrollbars: { theme: "os-theme-quebi", autoHide: "leave", autoHideDelay: 600 },
}

/**
 * Loads OverlayScrollbars and hands the caller an attached instance, once the
 * browser is idle. Returns a cancel function that covers both halves — the
 * wait and the instance — because a surface can unmount before either lands.
 *
 * The **dynamic import** is the point. `overlayscrollbars-react` used to be a
 * static import in four site modules, one of them reached from `root.tsx`, so
 * the library sat in the entry chunk's module graph and therefore on the
 * `modulepreload` list of *every* prerendered page: `/` downloaded, parsed and
 * ran a scrollbar implementation before it did anything else, on a page whose
 * hydration is otherwise free. `import()` moves that chunk off the critical
 * path — it is fetched after first paint, only by a page that reaches a scroll
 * surface (task #174).
 *
 * `requestIdleCallback` is Chromium and Firefox; Safari still does not have it,
 * so a timeout is the fallback. Either way the point is the same: none of this
 * belongs in the frame that paints the page.
 */
function attachWhenIdle(attach: (create: typeof OverlayScrollbars) => OverlayScrollbars) {
  let instance: OverlayScrollbars | undefined
  let cancelled = false

  const run = async () => {
    const { OverlayScrollbars: create } = await import("overlayscrollbars")
    // The import is a round trip; the surface may be gone by the time it lands.
    if (!cancelled) instance = attach(create)
  }

  const handle =
    typeof requestIdleCallback === "function"
      ? requestIdleCallback(run, { timeout: 2000 })
      : setTimeout(run, 1)

  return () => {
    cancelled = true
    if (typeof requestIdleCallback === "function") cancelIdleCallback(handle as number)
    else clearTimeout(handle as ReturnType<typeof setTimeout>)
    instance?.destroy()
  }
}

interface ScrollSurfaceProps {
  /** The host element. `nav` for the two sidebars, `div` everywhere else. */
  element?: "div" | "nav"
  className?: string
  children: React.ReactNode
}

/**
 * A scroll container with quebi's overlay scrollbars, attached after first
 * paint.
 *
 * The markup is exactly what `<OverlayScrollbarsComponent>` renders — a host
 * carrying `data-overlayscrollbars-initialize` around a
 * `data-overlayscrollbars-contents` child, adopted by the library as its own
 * viewport rather than generated — so this is a drop-in for that component,
 * minus the eager import of the React wrapper.
 *
 * The instance is also gated on the surface coming near the viewport, which is
 * what stops several containers instantiating in one frame. The library's own
 * `defer` option is already `requestIdleCallback` + rAF, but every instance on
 * the page waits on the *same* idle callback, so a component page's body, nav
 * and source block all did their setup back to back. One observer per container
 * spreads that out, and a source block the reader never scrolls to costs
 * nothing at all — measured as the whole of a 157 ms frame on
 * `/components/area-chart/` (task #174).
 *
 * Nothing is visible during the wait that would not be visible anyway, and
 * nothing moves when the upgrade lands: `data-overlayscrollbars-initialize` is
 * the library's own pre-init state, which sets `overflow: auto` and hides the
 * native bar, so the surface scrolls throughout and the overlay bars that
 * replace it take no layout width. A test DOM whose IntersectionObserver never
 * reports (happy-dom's is a no-op) simply leaves the surface in that state,
 * which is what a render test wants.
 */
export function ScrollSurface({ element = "div", className, children }: ScrollSurfaceProps) {
  const hostRef = useRef<HTMLElement | null>(null)
  const contentsRef = useRef<HTMLElement | null>(null)
  // Callback refs, because one `useRef<HTMLElement>` cannot be handed to both
  // `<div>` and `<nav>`: a RefObject is invariant in its element type, a ref
  // *function* is not.
  const setHost = useCallback((node: HTMLElement | null) => {
    hostRef.current = node
  }, [])
  const setContents = useCallback((node: HTMLElement | null) => {
    contentsRef.current = node
  }, [])

  useEffect(() => {
    const host = hostRef.current
    const contents = contentsRef.current
    if (!host || !contents) return

    let cancelAttach: (() => void) | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        cancelAttach = attachWhenIdle((create) =>
          create(
            { target: host, elements: { viewport: contents, content: contents } },
            QUEBI_SCROLLBAR_OPTIONS,
          ),
        )
      },
      // A little before the surface is reached, so the bars are already there
      // when it comes into view rather than appearing under the reader's eye.
      { rootMargin: "400px" },
    )
    observer.observe(host)

    return () => {
      observer.disconnect()
      cancelAttach?.()
    }
  }, [])

  const contents = (
    <div data-overlayscrollbars-contents="" ref={setContents}>
      {children}
    </div>
  )

  return element === "nav" ? (
    <nav data-overlayscrollbars-initialize="" ref={setHost} className={className}>
      {contents}
    </nav>
  ) : (
    <div data-overlayscrollbars-initialize="" ref={setHost} className={className}>
      {contents}
    </div>
  )
}

/**
 * Attaches quebi's overlay scrollbars to the page scrollbar (`document.body`).
 *
 * Mounted from `root.tsx`, so this is the one surface every page has — and the
 * reason the library used to be in every page's preload list. The
 * `data-overlayscrollbars-initialize` attributes `root.tsx` puts on `<html>`
 * and `<body>` hold the native bar back until this lands.
 */
export function BodyScrollbar() {
  useEffect(
    () =>
      attachWhenIdle((create) =>
        create({ target: document.body, cancel: { body: false } }, QUEBI_SCROLLBAR_OPTIONS),
      ),
    [],
  )

  return null
}
