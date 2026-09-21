"use client"

import { useCallback, useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type ScrollAreaOrientation = "vertical" | "horizontal" | "both"

/**
 * How the bar meets the surface.
 *
 * - `flush` — the default, and the quebi bar: a 6px pill hugging the edge, no
 *   padding around it, clipped to the surface's own rounded corner.
 * - `floating` — a 6px pill inside a 12px track, 3px clear of every edge. For
 *   content that scrolls *under* the bar, and for a bar a pointer user is
 *   expected to drag: 12px of track is twice the grab width.
 * - `none` — no bar, still scrollable. Only where something else already shows
 *   the scroll position.
 */
type ScrollAreaScrollbar = "flush" | "floating" | "none"

export interface ScrollAreaProps extends React.ComponentPropsWithRef<"div"> {
  scrollFade?: boolean
  scrollbarGutter?: boolean
  orientation?: ScrollAreaOrientation
  scrollbar?: ScrollAreaScrollbar
}

const SCROLLBAR_VARIANTS: Record<ScrollAreaScrollbar, string> = {
  // The base utility is already flush; the other two are variable overrides on
  // top of it, so all three are one class and no cascade race.
  flush: "",
  floating: "quebi-scrollbar-floating",
  none: "quebi-scrollbar-none",
}

/**
 * ScrollArea — quebi design system
 *
 * A scrollable viewport with the quebi native scrollbar: a 6px tinted pill
 * hugging the edge, no stepper arrows and no padding around it (`scrollbar`
 * picks a different bar — see `ScrollAreaScrollbar`). Optionally fades content
 * at the scrolled edges (`scrollFade`) and reserves the bar's gutter so content
 * doesn't shift when it appears (`scrollbarGutter`). Self-contained: no Radix,
 * no portals — just a native overflow container with overflow-state data
 * attributes wired up for masking.
 *
 * **The corner.** A scrollbar is painted inside the border box but `overflow`
 * and `border-radius` do not clip it, so on a rounded surface the bar used to
 * run out through the arc and square off against the top and bottom edges. The
 * viewport carries `quebi-scrollbar-corners`, whose `clip-path: border-box` is
 * the same rounded rect the border draws — so the bar's ends curve away with
 * the corner. It follows whatever radius the surface actually has, including
 * the `rounded-[inherit]` this element takes from its parent, which is why
 * there is no radius prop to keep in sync. Two consequences worth knowing:
 * the clip also trims anything painted *outside* the border box, so a glow or
 * an `outline` ring on the ScrollArea itself is cut by it; and past roughly
 * `rounded-[calc(infinity*1px)]` the arc is longer than the bar's travel, so a
 * capsule-shaped scroll surface wants `scrollbar="floating"` instead.
 *
 * `className` lands on the scroll container itself, which is the only place it
 * can land: the browser paints the scrollbar at the inner edge of the scroll
 * container's border box, so padding declared on a wrapper *around* it insets
 * the bar from the card edge and leaves a dead strip beyond it. Pad the
 * ScrollArea — `<ScrollArea className="p-4">` — and the padding reads as content
 * inset while the bar still hugs the edge. This matches every other scrollable
 * quebi surface (Menu, ListBox, the select popovers), which pad their overflow
 * container directly.
 */
export function ScrollArea({
  ref: forwardedRef,
  className,
  children,
  scrollFade = false,
  scrollbarGutter = false,
  orientation = "both",
  scrollbar = "flush",
  ...props
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const isThrottledRef = useRef(false)

  const allowY = orientation === "vertical" || orientation === "both"
  const allowX = orientation === "horizontal" || orientation === "both"

  // One element, two refs: the effect below needs the node and so does the
  // consumer, and a consumer's ref on a ScrollArea is only useful if it points
  // at the thing that scrolls.
  const setViewport = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const update = () => {
      const rawHasY = el.scrollHeight > el.clientHeight + 1
      const rawHasX = el.scrollWidth > el.clientWidth + 1

      const hasY = allowY && rawHasY
      const hasX = allowX && rawHasX

      el.toggleAttribute("data-has-overflow-y", hasY)
      el.toggleAttribute("data-has-overflow-x", hasX)

      const yStart = hasY ? Math.max(0, el.scrollTop) : 0
      const yEnd = hasY ? Math.max(0, el.scrollHeight - el.clientHeight - el.scrollTop) : 0
      const xStart = hasX ? Math.max(0, el.scrollLeft) : 0
      const xEnd = hasX ? Math.max(0, el.scrollWidth - el.clientWidth - el.scrollLeft) : 0

      el.style.setProperty("--scroll-area-overflow-y-start", `${yStart}px`)
      el.style.setProperty("--scroll-area-overflow-y-end", `${yEnd}px`)
      el.style.setProperty("--scroll-area-overflow-x-start", `${xStart}px`)
      el.style.setProperty("--scroll-area-overflow-x-end", `${xEnd}px`)
    }

    const scheduleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    const throttledScrollUpdate = () => {
      if (isThrottledRef.current) return
      isThrottledRef.current = true
      scheduleUpdate()
      setTimeout(() => {
        isThrottledRef.current = false
      }, 16)
    }

    const ro = new ResizeObserver(scheduleUpdate)
    ro.observe(el)

    el.addEventListener("scroll", throttledScrollUpdate, { passive: true })
    update()

    return () => {
      el.removeEventListener("scroll", throttledScrollUpdate)
      ro.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [allowX, allowY])

  return (
    <div
      ref={setViewport}
      className={cn(
        "size-full min-h-0 overscroll-auto rounded-[inherit] outline-none transition-shadow",
        "data-has-overflow-y:overscroll-y-contain data-has-overflow-x:overscroll-x-contain",
        // Slim, cyan-tinted scrollbar — the shared quebi native scrollbar,
        // clipped to this surface's own rounded corner.
        "quebi-scrollbar quebi-scrollbar-corners",
        SCROLLBAR_VARIANTS[scrollbar],
        orientation === "vertical"
          ? "overflow-x-hidden overflow-y-auto"
          : orientation === "horizontal"
            ? "overflow-x-auto overflow-y-hidden"
            : "overflow-auto",
        scrollFade && [
          allowY &&
            "mask-t-from-[calc(100%-min(var(--fade-size,--spacing(6)),var(--scroll-area-overflow-y-start,0)))] mask-b-from-[calc(100%-min(var(--fade-size,--spacing(6)),var(--scroll-area-overflow-y-end,0)))]",
          allowX &&
            "mask-l-from-[calc(100%-min(var(--fade-size,--spacing(6)),var(--scroll-area-overflow-x-start,0)))] mask-r-from-[calc(100%-min(var(--fade-size,--spacing(6)),var(--scroll-area-overflow-x-end,0)))]",
        ],
        // The CSS property, not padding: padding is the consumer's to spend on
        // content inset, and a gutter added only once the bar is already there
        // reserves nothing. `stable` holds the space whether it shows or not.
        scrollbarGutter && "[scrollbar-gutter:stable]",
        className,
      )}
      data-slot="scroll-area-viewport"
      {...props}
    >
      {children}
    </div>
  )
}
