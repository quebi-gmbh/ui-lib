/**
 * Which ChoiceBox card is painted on top of which.
 *
 * In the default one-column layout the cards share their hairlines: each one is
 * pulled up a pixel over the one before it (`-mt-px`) and each one is opaque,
 * so the later card paints over the earlier card's bottom edge — and over its
 * focus ring, which is drawn outside the border box — unless the earlier card
 * is lifted out of the way. Selection used to be the only state that lifted a
 * card, so clicking a card and then clicking it again left it focused, ringed,
 * and back at `z-index: auto`: the bottom of the ring and the bottom border
 * vanished under the next card. Task #113.
 *
 * Paint order is not something happy-dom can be asked about, so what is pinned
 * here is the class the order follows from: every state that draws outside its
 * own border box carries a `z-*`, and a ring outranks a selected neighbour.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChoiceBox, ChoiceBoxItem } from "../../src/components/choice-box"

const renderPlans = (props?: {
  defaultSelectedKeys?: string[]
  selectionMode?: "single" | "multiple"
}) => {
  const { container } = render(
    <ChoiceBox aria-label="Plan" {...props}>
      <ChoiceBoxItem id="starter" label="Starter" description="For solo projects." />
      <ChoiceBoxItem id="pro" label="Pro" description="For growing teams." />
      <ChoiceBoxItem id="enterprise" label="Enterprise" description="Advanced controls." />
    </ChoiceBox>,
  )
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="choice-box-item"]'),
  )
  const byId = (id: string) => {
    const card = cards.find((c) => c.textContent?.startsWith(id))
    if (!card) throw new Error(`no card for ${id}`)
    return card
  }
  return { cards, pro: byId("Pro"), starter: byId("Starter"), enterprise: byId("Enterprise") }
}

/** The stacking layer a card's classes put it on: `z-20` → 20, none → 0. */
const layerOf = (card: HTMLElement) => {
  const z = Array.from(card.classList).filter((c) => /^z-\d+$/.test(c))
  expect(z.length).toBeLessThanOrEqual(1)
  return z.length === 0 ? 0 : Number(z[0].slice(2))
}

describe("ChoiceBox stacking", () => {
  test("a card that is merely there sits on no layer at all", () => {
    const { cards } = renderPlans()
    for (const card of cards) expect(layerOf(card)).toBe(0)
  })

  test("a selected card is lifted over its neighbour", () => {
    const { pro, starter } = renderPlans({ defaultSelectedKeys: ["pro"] })
    expect(pro.getAttribute("aria-selected")).toBe("true")
    expect(layerOf(pro)).toBeGreaterThan(layerOf(starter))
  })

  test("a card deselected by a second click keeps its ring above the next card", async () => {
    const user = userEvent.setup()
    const { pro, starter } = renderPlans()

    await user.click(pro)
    expect(pro.getAttribute("aria-selected")).toBe("true")
    const selectedLayer = layerOf(pro)

    await user.click(pro)
    expect(pro.getAttribute("aria-selected")).toBe("false")
    // Still focused, so still ringed — and the ring is drawn outside the border
    // box, which is precisely the part the next card would cover.
    expect(pro.getAttribute("data-focused")).toBe("true")
    expect(pro.className).toContain("ring-2")
    expect(layerOf(pro)).toBeGreaterThan(layerOf(starter))
    expect(layerOf(pro)).toBeGreaterThanOrEqual(selectedLayer)
  })

  // The card that would do the covering is the one *after* the focused one, so
  // the case the ring has to beat is a focused card followed by a selected one.
  // Only multiple selection can hold both at once.
  test("a focused card outranks the selected card below it", async () => {
    const user = userEvent.setup()
    const { pro, enterprise } = renderPlans({
      selectionMode: "multiple",
      defaultSelectedKeys: ["enterprise"],
    })

    await user.click(pro)
    await user.click(pro)

    expect(enterprise.getAttribute("aria-selected")).toBe("true")
    expect(pro.getAttribute("aria-selected")).toBe("false")
    expect(pro.getAttribute("data-focused")).toBe("true")
    expect(layerOf(pro)).toBeGreaterThan(layerOf(enterprise))
  })
})
