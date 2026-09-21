import { Gallery, type GalleryItem } from "@/components/gallery"
import type { OgScene } from "./types"

/**
 * Local images. The gallery example loads photographs from picsum.photos, which
 * is right for a page you are reading and wrong for a build step: a share image
 * that is only correct when a third-party CDN answers is not one, and a
 * screenshot has to be the same picture twice.
 */
const ITEMS: GalleryItem[] = [
  { id: "1", src: "/og-scene/tile-1.svg", alt: "Teal ridge" },
  { id: "2", src: "/og-scene/tile-2.svg", alt: "Violet dusk" },
  { id: "3", src: "/og-scene/tile-3.svg", alt: "Blue shore" },
]

export const galleryOgScene: OgScene = {
  scale: 1.2,
  render: () => (
    <div className="w-80">
      <Gallery items={ITEMS} />
    </div>
  ),
}
