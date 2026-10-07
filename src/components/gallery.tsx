"use client"

import { ChevronLeft, ChevronRight, ImageIcon, ZoomIn } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ModalContent } from "@/components/modal"
import { Button } from "react-aria-components"

export interface GalleryItem {
  id: string
  src: string
  alt?: string
}

export interface GalleryProps {
  items: GalleryItem[]
  className?: string
  /** Rendered in place of the hero when `items` is empty. Falls back to a
   * neutral placeholder box. */
  emptyState?: React.ReactNode
}

/**
 * Gallery — quebi design system
 *
 * Presentational image gallery: a large hero image with a thumbnail strip
 * below to switch between images, and a click-to-zoom lightbox built on Modal.
 * Selection is internal state — pass a stable `items` list and the component
 * keeps the active thumbnail in view. Pure client-side (no data fetching), so
 * it works for any image set.
 *
 * Square and ruled: hairline frames, the current thumbnail framed in ink, and
 * the lightbox on the page ground with square outline controls — no scrims or
 * blurred chips over the picture.
 */
export function Gallery({ items, className, emptyState }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (items.length === 0) {
    return (
      <div
        data-slot="gallery-empty"
        className={cn(
          "flex aspect-[4/3] w-full items-center justify-center border border-quebi-hairline bg-quebi-raised text-quebi-fg-subtle",
          className,
        )}
      >
        {emptyState ?? <ImageIcon className="size-8" aria-hidden />}
      </div>
    )
  }

  // Clamp so the hero stays valid if `items` shrinks between renders.
  const activeIndex = Math.min(selectedIndex, items.length - 1)
  const active = items[activeIndex]
  const hasMultiple = items.length > 1

  // Step the selection with wraparound — drives both the inline hero and the
  // lightbox, so navigating in the lightbox keeps the strip in sync.
  const step = (delta: number) =>
    setSelectedIndex((current) => {
      const base = Math.min(current, items.length - 1)
      return (base + delta + items.length) % items.length
    })

  return (
    <div data-slot="gallery" className={cn("flex flex-col gap-2", className)}>
      <Button
        aria-label="Enlarge image"
        onPress={() => setLightboxOpen(true)}
        className="group relative flex aspect-[4/3] w-full cursor-zoom-in items-center justify-center overflow-hidden border border-quebi-hairline bg-quebi-bg outline-hidden data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-3 data-[focus-visible]:ring-offset-quebi-bg"
      >
        <img
          src={active.src}
          alt={active.alt ?? ""}
          className="size-full object-contain"
          loading="lazy"
        />
        <span className="absolute right-2 bottom-2 bg-quebi-action p-1.5 text-quebi-on-action opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-data-[focus-visible]:opacity-100">
          <ZoomIn className="size-4" aria-hidden />
        </span>
      </Button>

      {hasMultiple && (
        <ul
          // p-1 (not just pb-1): overflow-x-auto also clips vertically, so the
          // selected thumbnail's ring needs room on every side or it's cut off.
          data-slot="gallery-thumbnails"
          className="m-0 flex list-none gap-2 overflow-x-auto p-1"
        >
          {items.map((item, index) => (
            <li key={item.id}>
              <Button
                aria-label={item.alt || `Image ${index + 1}`}
                aria-current={index === activeIndex}
                onPress={() => setSelectedIndex(index)}
                className={cn(
                  "size-14 shrink-0 overflow-hidden border bg-quebi-bg outline-hidden transition-colors duration-150",
                  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-inset",
                  // Current: an ink frame, the border doubled by a 1px ring so
                  // the thumbnail does not change size.
                  index === activeIndex
                    ? "border-quebi-rule ring-1 ring-quebi-rule"
                    : "border-quebi-hairline hover:border-quebi-rule",
                )}
              >
                <img src={item.src} alt="" className="size-full object-contain" loading="lazy" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* State opens this, not an element, so ModalContent carries the open
          state itself — wrapping it in `Modal` (a DialogTrigger) would put it
          in the trigger slot with nothing to press. Focus returns to the hero
          button on close either way; that is the overlay's focus scope. */}
      <ModalContent
        isOpen={lightboxOpen}
        onOpenChange={setLightboxOpen}
        size="4xl"
        aria-label={active.alt ?? "Image"}
        className="p-0!"
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: the Dialog owns
            focus; this only adds arrow-key paging on top of the nav buttons. */}
        <div
          className="relative flex items-center justify-center bg-quebi-bg"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault()
              step(-1)
            } else if (event.key === "ArrowRight") {
              event.preventDefault()
              step(1)
            }
          }}
        >
          <img
            src={active.src}
            alt={active.alt ?? ""}
            className="max-h-[80vh] w-full object-contain"
          />
          {hasMultiple && (
            <>
              <Button
                aria-label="Previous image"
                onPress={() => step(-1)}
                className="absolute start-2 border border-quebi-rule bg-quebi-bg p-2 text-quebi-fg outline-hidden transition-colors duration-150 hover:bg-quebi-raised data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-3 data-[focus-visible]:ring-offset-quebi-bg"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </Button>
              <Button
                aria-label="Next image"
                onPress={() => step(1)}
                className="absolute end-2 border border-quebi-rule bg-quebi-bg p-2 text-quebi-fg outline-hidden transition-colors duration-150 hover:bg-quebi-raised data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-3 data-[focus-visible]:ring-offset-quebi-bg"
              >
                <ChevronRight className="size-6" aria-hidden />
              </Button>
              <span className="absolute bottom-3 bg-quebi-bg px-2 py-1 font-mono text-quebi-fg-subtle text-quebi-label tabular-nums">
                {activeIndex + 1} / {items.length}
              </span>
            </>
          )}
        </div>
      </ModalContent>
    </div>
  )
}
