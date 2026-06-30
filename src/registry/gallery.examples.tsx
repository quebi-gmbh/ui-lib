import { Gallery, type GalleryItem } from "@/components/gallery"
import type { ComponentExample } from "./types"

const items: GalleryItem[] = [
  { id: "1", src: "https://picsum.photos/seed/1/400/300", alt: "Mountain landscape" },
  { id: "2", src: "https://picsum.photos/seed/2/400/300", alt: "Forest path" },
  { id: "3", src: "https://picsum.photos/seed/3/400/300", alt: "City skyline" },
  { id: "4", src: "https://picsum.photos/seed/4/400/300", alt: "Ocean waves" },
  { id: "5", src: "https://picsum.photos/seed/5/400/300", alt: "Desert dunes" },
]

export const galleryExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Hero image plus a thumbnail strip. Click the hero to open the lightbox, then page with the arrows or arrow keys.",
    render: () => (
      <div className="w-full max-w-md">
        <Gallery items={items} />
      </div>
    ),
  },
  {
    title: "Single image",
    description: "With one item the thumbnail strip and lightbox paging are hidden.",
    render: () => (
      <div className="w-full max-w-md">
        <Gallery items={[{ id: "1", src: "https://picsum.photos/seed/42/400/300", alt: "A single photo" }]} />
      </div>
    ),
  },
  {
    title: "Empty",
    description: "Falls back to a neutral placeholder box when there are no items.",
    render: () => (
      <div className="w-full max-w-md">
        <Gallery items={[]} />
      </div>
    ),
  },
]
