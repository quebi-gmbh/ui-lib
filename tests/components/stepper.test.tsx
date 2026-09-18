/**
 * Stepper's flat default, and the one prop that undoes it.
 *
 * The glow used to be welded into the state classes, so a four-step admin
 * stepper drew three haloes at once and there was no way to ask for fewer. The
 * guarantee now is a pair: nothing glows unless `glow` is set, and when it is,
 * both bullet sizes glow the same way — the two variants render through
 * separate components, which is exactly the shape that drifts if only one of
 * them is checked.
 *
 * The states themselves are the reason dropping the shadow is safe, so they are
 * pinned too: `done` is a teal fill, `active` is a teal ring, `upcoming` is
 * neither. Lose one of those and the flat default stops being legible.
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
    el.className.includes("rounded-full border-2"),
  ) as HTMLElement[]

const classes = () => bullets().map((b) => b.className)

describe.each(["admin", "kiosk"] as const)("Stepper variant=%s", (variant) => {
  test("draws no glow by default", () => {
    render(<Stepper variant={variant} steps={steps} />)

    // The loop would pass over an empty list, and the selector is the one part
    // of this file that a markup change could quietly invalidate.
    expect(classes()).toHaveLength(steps.length)
    for (const className of classes()) {
      expect(className).not.toContain("shadow-quebi-glow")
    }
  })

  test("glow puts the strong halo on active and the subtle one on done", () => {
    render(<Stepper variant={variant} glow steps={steps} />)
    const [done, active, upcoming] = classes()

    expect(done).toContain("shadow-quebi-glow")
    expect(done).not.toContain("shadow-quebi-glow-strong")
    expect(active).toContain("shadow-quebi-glow-strong")
    // A step that has not happened has nothing to announce, glow or not.
    expect(upcoming).not.toContain("shadow-quebi-glow")
  })

  test("state reads from fill and border, which is what makes the flat default work", () => {
    render(<Stepper variant={variant} steps={steps} />)
    const [done, active, upcoming] = classes()

    expect(done).toContain("bg-quebi-brand")
    expect(active).toContain("border-quebi-brand")
    expect(active).toContain("text-quebi-brand-text")
    expect(upcoming).not.toContain("bg-quebi-brand")
    expect(upcoming).not.toContain("border-quebi-brand")
  })

  test("marks the active step for assistive technology either way", () => {
    const { rerender } = render(<Stepper variant={variant} steps={steps} />)
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1)

    rerender(<Stepper variant={variant} glow steps={steps} />)
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
  })
})

describe("Stepper", () => {
  test("labels the list so the progress is announced as one thing", () => {
    render(<Stepper steps={steps} aria-label="Onboarding progress" />)
    expect(screen.getByRole("list", { name: "Onboarding progress" })).not.toBeNull()
  })
})
