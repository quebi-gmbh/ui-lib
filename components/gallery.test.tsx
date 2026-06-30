import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Gallery } from "./gallery"

const ITEMS = [
  { id: "a", src: "https://imagedelivery.net/h/a/public", alt: "Front" },
  { id: "b", src: "https://imagedelivery.net/h/b/public", alt: "Back" },
  { id: "c", src: "https://imagedelivery.net/h/c/public", alt: "Side" },
]

describe("Gallery", () => {
  it("shows the first item as the hero and one thumbnail per item", () => {
    render(<Gallery items={ITEMS} />)

    // The hero is the only <img> carrying the item's alt text; thumbnails use "".
    expect(screen.getByAltText("Front")).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="gallery-thumbnails"] button')).toHaveLength(3)
  })

  it("swaps the hero when a thumbnail is clicked", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ITEMS} />)

    await user.click(screen.getByRole("button", { name: "Side" }))

    expect(await screen.findByAltText("Side")).toBeInTheDocument()
    expect(
      document.querySelector('[data-slot="gallery-thumbnails"] button[aria-current="true"]'),
    ).toHaveAttribute("aria-label", "Side")
  })

  it("opens a lightbox from the hero and pages through images with wraparound", async () => {
    const user = userEvent.setup()
    render(<Gallery items={ITEMS} />)

    await user.click(screen.getByRole("button", { name: "Bild vergrößern" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("1 / 3")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Nächstes Bild" }))
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument()

    // Two steps back from #2 wraps 1 → 3.
    await user.click(within(dialog).getByRole("button", { name: "Vorheriges Bild" }))
    await user.click(within(dialog).getByRole("button", { name: "Vorheriges Bild" }))
    expect(within(dialog).getByText("3 / 3")).toBeInTheDocument()
  })

  it("omits lightbox paging controls for a single image", async () => {
    const user = userEvent.setup()
    render(
      <Gallery
        items={[{ id: "only", src: "https://imagedelivery.net/h/only/public", alt: "Only" }]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Bild vergrößern" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "Nächstes Bild" })).not.toBeInTheDocument()
  })

  it("hides the thumbnail strip for a single image", () => {
    render(
      <Gallery
        items={[{ id: "only", src: "https://imagedelivery.net/h/only/public", alt: "Only" }]}
      />,
    )

    expect(screen.getByAltText("Only")).toBeInTheDocument()
    expect(document.querySelector('[data-slot="gallery-thumbnails"]')).toBeNull()
  })

  it("renders the provided empty state when there are no images", () => {
    render(<Gallery items={[]} emptyState={<span>Keine Bilder</span>} />)

    expect(screen.getByText("Keine Bilder")).toBeInTheDocument()
  })

  it("falls back to a placeholder box when empty with no empty state", () => {
    render(<Gallery items={[]} />)

    expect(document.querySelector('[data-slot="gallery-empty"]')).not.toBeNull()
  })
})
