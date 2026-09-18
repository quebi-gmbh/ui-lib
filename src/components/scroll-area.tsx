"use client"

import { useCallback, useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type ScrollAreaOrientation = "vertical" | "horizontal" | "both"

export interface ScrollAreaProps extends React.ComponentPropsWithRef<"div"> {
  scrollFade?: boolean
  scrollbarGutter?: boolean
  orientation?: ScrollAreaOrientation
}

/**
 * ScrollArea — quebi design system
 *
 * A scrollable viewport with the quebi native scrollbar (a 6px cyan pill
 * floating 3px clear of the edges, no stepper arrows). Optionally fades content
 * at the scrolled edges (`scrollFade`) and reserves the bar's gutter so content
 * doesn't shift when it appears (`scrollbarGutter`). Self-contained: no Radix,
 * no portals — just a native overflow container with overflow-state data
 * attributes wired up for masking.
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
        // Slim, cyan-tinted scrollbar — the shared quebi native scrollbar.
        "quebi-scrollbar",
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
