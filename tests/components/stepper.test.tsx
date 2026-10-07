/**
 * Stepper's states, read from ink alone.
 *
 * There is no hue and no halo to carry the state, so the bullets' fill and ring
 * are the whole signal and are pinned here: `active` is the one solid action
 * fill, `done` an ink ring, `upcoming` a hairline ring. The two variants render
 * through separate components, which is exactly the shape that drifts if only
 * one of them is checked. `glow` survives as an accepted prop that draws
 * nothing, so an old caller neither breaks nor brings a shadow back.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Stepper, type StepItem } from "../../src/components/stepper"

const steps: StepItem[] = [
  { id: "a", label: "Account", status: "done" },
  { id: "b", label: "Billing", status: "active" },
  { id: "c", label: "Review", status: "upcoming" },
]

/** Every bullet, in order — the spans inside the list items. */
const bullets = () =>
  Array.from(document.querySelectorAll("li > div > span, li > span")).filter((el) =>
    el.className.includes("rounded-full border"),
  ) as HTMLElement[]

const classes = () => bullets().map((b) => b.className)

describe.each(["admin", "kiosk"] as const)("Stepper variant=%s", (variant) => {
  test("draws no shadow, with or without the legacy glow prop", () => {
    const { rerender } = render(<Stepper variant={variant} steps={steps} />)

    // The loop would pass over an empty list, and the selector is the one part
    // of this file that a markup change could quietly invalidate.
    expect(classes()).toHaveLength(steps.length)
    const flat = classes()
    for (const className of flat) {
      expect(className).not.toContain("shadow")
    }

    rerender(<Stepper variant={variant} glow steps={steps} />)
    expect(classes()).toEqual(flat)
  })

  test("only the active step is filled; done and upcoming differ by ring and ink", () => {
    render(<Stepper variant={variant} steps={steps} />)
    const [done, active, upcoming] = classes()

    expect(active).toContain("bg-quebi-action")
    expect(active).toContain("text-quebi-on-action")
    expect(done).not.toContain("bg-quebi-action")
    expect(done).toContain("border-quebi-rule")
    expect(done).toContain("text-quebi-fg")
    expect(upcoming).not.toContain("bg-quebi-action")
    expect(upcoming).toContain("border-quebi-hairline")
  })

  test("marks the active step for assistive technology", () => {
    render(<Stepper variant={variant} steps={steps} />)
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
  })
})

describe("Stepper", () => {
  test("labels the list so the progress is announced as one thing", () => {
    render(<Stepper steps={steps} aria-label="Onboarding progress" />)
    expect(screen.getByRole("list", { name: "Onboarding progress" })).not.toBeNull()
  })
})
