"use client"

import { ChevronLeft, ChevronRight, ImageIcon, ZoomIn } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Modal, ModalContent } from "@/components/modal"

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
 */
export function Gallery({ items, className, emptyState }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (items.length === 0) {
    return (
      <div
        data-slot="gallery-empty"
        className={cn(
          "flex aspect-[4/3] w-full items-center justify-center rounded-quebi-md border border-cyan-500/10 bg-quebi-bg text-quebi-fg-muted",
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
      <button
        type="button"
        aria-label="Enlarge image"
        onClick={() => setLightboxOpen(true)}
        className="group relative flex aspect-[4/3] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-quebi-md border border-cyan-500/10 bg-quebi-bg transition-shadow duration-200 hover:shadow-quebi-glow"
      >
        <img
          src={active.src}
          alt={active.alt ?? ""}
          className="size-full object-contain"
          loading="lazy"
        />
        <span className="absolute right-2 bottom-2 rounded-quebi-sm bg-black/60 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIn className="size-4" aria-hidden />
        </span>
      </button>

      {hasMultiple && (
        <ul
          // p-1 (not just pb-1): overflow-x-auto also clips vertically, so the
          // selected thumbnail's ring needs room on every side or it's cut off.
          data-slot="gallery-thumbnails"
          className="m-0 flex list-none gap-2 overflow-x-auto p-1"
        >
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                aria-label={item.alt || `Image ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "size-14 shrink-0 overflow-hidden rounded-quebi-sm border bg-quebi-bg transition-colors duration-150",
                  index === activeIndex
                    ? "border-quebi-brand ring-1 ring-quebi-brand"
                    : "border-cyan-500/10 hover:border-cyan-500/20",
                )}
              >
                <img src={item.src} alt="" className="size-full object-contain" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={lightboxOpen} onOpenChange={setLightboxOpen}>
        <ModalContent size="4xl" aria-label={active.alt ?? "Image"} className="p-0!">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: the Dialog owns
              focus; this only adds arrow-key paging on top of the nav buttons. */}
          <div
            className="relative flex items-center justify-center bg-black"
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
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => step(-1)}
                  className="absolute start-2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/80"
                >
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => step(1)}
                  className="absolute end-2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/80"
                >
                  <ChevronRight className="size-6" aria-hidden />
                </button>
                <span className="absolute bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white tabular-nums backdrop-blur-sm">
                  {activeIndex + 1} / {items.length}
                </span>
              </>
            )}
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
