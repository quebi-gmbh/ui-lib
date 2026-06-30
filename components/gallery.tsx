import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline"
import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { Modal, ModalContent } from "./modal"

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
 * Presentational image gallery: a large hero image with a thumbnail strip
 * below to switch between images, and a click-to-zoom lightbox. Selection is
 * internal state — pass a stable `items` list and the component keeps the
 * active thumbnail in view. Pure client-side (no data fetching), so it lives in
 * the shared library and works for any image set.
 */
export function Gallery({ items, className, emptyState }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (items.length === 0) {
    return (
      <div
        data-slot="gallery-empty"
        className={twMerge(
          "flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-border bg-muted text-muted-fg",
          className,
        )}
      >
        {emptyState ?? <PhotoIcon className="size-8" aria-hidden />}
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
    <div data-slot="gallery" className={twMerge("flex flex-col gap-2", className)}>
      <button
        type="button"
        aria-label="Bild vergrößern"
        onClick={() => setLightboxOpen(true)}
        className="group relative flex aspect-[4/3] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
      >
        <img
          src={active.src}
          alt={active.alt ?? ""}
          className="size-full object-contain"
          loading="lazy"
        />
        <span className="absolute right-2 bottom-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <MagnifyingGlassPlusIcon className="size-4" aria-hidden />
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
                aria-label={item.alt || `Bild ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setSelectedIndex(index)}
                className={twMerge(
                  "size-14 shrink-0 overflow-hidden rounded-md border bg-muted transition-colors",
                  index === activeIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-fg",
                )}
              >
                <img src={item.src} alt="" className="size-full object-contain" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={lightboxOpen} onOpenChange={setLightboxOpen}>
        <ModalContent size="4xl" aria-label={active.alt ?? "Bild"} className="p-0!">
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
                  aria-label="Vorheriges Bild"
                  onClick={() => step(-1)}
                  className="absolute start-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                >
                  <ChevronLeftIcon className="size-6" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Nächstes Bild"
                  onClick={() => step(1)}
                  className="absolute end-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                >
                  <ChevronRightIcon className="size-6" aria-hidden />
                </button>
                <span className="absolute bottom-3 rounded-pill bg-black/60 px-2 py-0.5 text-caption text-white tabular-nums">
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
