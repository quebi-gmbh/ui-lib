/**
 * Gallery behaviour.
 *
 * Gallery is the most stateful component in the library: a hero image, a
 * thumbnail strip that selects it, and a lightbox that pages through the same
 * selection with wraparound. None of that is visible to type checking or to the
 * lint rules, and all of it breaks silently — a stale `activeIndex`, a strip
 * rendered for a single image, paging that stops at the ends instead of
 * wrapping. These assertions were re-derived from the Cellestial-era
 * `components/gallery.test.tsx` (deleted in task #4, never ran) against the
 * current source: the labels are English now, and the empty state is a
 * `[data-slot="gallery-empty"]` box.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Gallery } from "../../src/components/gallery"

const ITEMS = [
  { id: "a", src: "https://images.example.com/a.jpg", alt: "Front" },
  { id: "b", src: "https://images.example.com/b.jpg", alt: "Back" },
  { id: "c", src: "https://images.example.com/c.jpg", alt: "Side" },
]

const ONE_ITEM = [{ id: "only", src: "https://images.example.com/only.jpg", alt: "Only" }]

const thumbnails = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-slot="gallery-thumbnails"] button'))

const currentThumbnail = () =>
  document.querySelector('[data-slot="gallery-thumbnails"] button[aria-current="true"]')

describe("Gallery", () => {
  test("shows the first item as the hero, and one thumbnail per item", () => {
    render(<Gallery items={ITEMS} />)

    // The hero is the only <img> carrying the item's alt text — thumbnails
    // render alt="" because their button already carries the label.
    expect(screen.getByAltText("Front")).toBeInTheDocument()
    expect(thumbnails()).toHaveLength(3)
    expect(currentThumbnail()).toHaveAttribute("aria-label", "Front")
  })

  test("swaps the hero when a thumbnail is pressed, and moves aria-current with it", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ITEMS} />)

    await user.click(screen.getByRole("button", { name: "Side" }))

    expect(screen.getByAltText("Side")).toBeInTheDocument()
    expect(screen.queryByAltText("Front")).not.toBeInTheDocument()
    expect(currentThumbnail()).toHaveAttribute("aria-label", "Side")
  })

  test("labels a thumbnail by position when the item has no alt text", () => {
    render(<Gallery items={[{ id: "a", src: "/a.jpg" }, { id: "b", src: "/b.jpg" }]} />)

    expect(screen.getByRole("button", { name: "Image 2" })).toBeInTheDocument()
  })

  test("opens a lightbox from the hero", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ITEMS} />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Enlarge image" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("1 / 3")).toBeInTheDocument()
  })

  test("pages through the lightbox, wrapping 1 → 3 backwards", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ITEMS} />)
    await user.click(screen.getByRole("button", { name: "Enlarge image" }))
    const dialog = await screen.findByRole("dialog")

    await user.click(within(dialog).getByRole("button", { name: "Next image" }))
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument()

    // Two steps back from #2 wraps past the start: 2 → 1 → 3.
    await user.click(within(dialog).getByRole("button", { name: "Previous image" }))
    await user.click(within(dialog).getByRole("button", { name: "Previous image" }))
    expect(within(dialog).getByText("3 / 3")).toBeInTheDocument()
  })

  test("keeps the thumbnail strip in sync with lightbox paging", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ITEMS} />)
    await user.click(screen.getByRole("button", { name: "Enlarge image" }))
    const dialog = await screen.findByRole("dialog")

    await user.click(within(dialog).getByRole("button", { name: "Next image" }))

    expect(currentThumbnail()).toHaveAttribute("aria-label", "Back")
  })

  test("omits the thumbnail strip for a single image", () => {
    render(<Gallery items={ONE_ITEM} />)

    expect(screen.getByAltText("Only")).toBeInTheDocument()
    expect(document.querySelector('[data-slot="gallery-thumbnails"]')).toBeNull()
  })

  test("omits the lightbox paging controls for a single image", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ONE_ITEM} />)

    await user.click(screen.getByRole("button", { name: "Enlarge image" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "Next image" })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole("button", { name: "Previous image" })).not.toBeInTheDocument()
    expect(within(dialog).queryByText("1 / 1")).not.toBeInTheDocument()
  })

  test("renders the provided empty state when there are no images", () => {
    render(<Gallery items={[]} emptyState={<span>No images</span>} />)

    expect(screen.getByText("No images")).toBeInTheDocument()
    expect(document.querySelector('[data-slot="gallery-empty"]')).not.toBeNull()
  })

  test("falls back to a placeholder box when empty with no empty state", () => {
    render(<Gallery items={[]} />)

    const empty = document.querySelector('[data-slot="gallery-empty"]')
    expect(empty).not.toBeNull()
    // The fallback is an icon, and an icon alone is not content: it is
    // aria-hidden, so the box is empty to a screen reader rather than lying.
    expect(empty?.querySelector("svg")).toHaveAttribute("aria-hidden")
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })
})
