/**
 * Note's status icon.
 *
 * The icon is the part with a rule attached to it: it is decoration duplicating
 * the intent colour and the text, so it must be `aria-hidden` — otherwise every
 * callout announces a stray graphic — and the neutral `default` intent has no
 * status to signal, so it gets no icon at all. `indicator={false}` is the opt
 * out for callers who supply their own leading element.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Note } from "../../src/components/note"

const STATUS_INTENTS = ["info", "success", "warning", "danger"] as const

describe("Note", () => {
  test("renders its children, and a title above them when given one", () => {
    render(
      <Note intent="danger" title="Couldn't publish">
        Fix the highlighted prices.
      </Note>,
    )

    expect(screen.getByText("Fix the highlighted prices.")).toBeInTheDocument()
    expect(screen.getByText("Couldn't publish")).toBeInTheDocument()
  })

  test("the default intent renders no status icon", () => {
    const { container } = render(<Note>Draft plan.</Note>)

    expect(container.querySelector("svg")).toBeNull()
  })

  test.each(STATUS_INTENTS.map((intent) => [intent] as const))("the %s intent renders a decorative status icon", (intent) => {
    const { container } = render(<Note intent={intent}>Message</Note>)

    const icon = container.querySelector("svg")
    expect(icon).not.toBeNull()
    // Decoration only: the intent is already carried by the text.
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  test("each status intent uses an icon of its own", () => {
    const paths = STATUS_INTENTS.map((intent) => {
      const { container } = render(<Note intent={intent}>Message</Note>)
      return container.querySelector("svg path")?.getAttribute("d")
    })

    expect(new Set(paths).size).toBe(STATUS_INTENTS.length)
  })

  test("indicator={false} suppresses the icon even for a status intent", () => {
    const { container } = render(
      <Note intent="success" indicator={false}>
        Saved.
      </Note>,
    )

    expect(container.querySelector("svg")).toBeNull()
  })

  test("a caller's className and props land on the root alongside the intent classes", () => {
    render(
      <Note intent="danger" className="mb-6" role="alert" data-testid="note">
        Error
      </Note>,
    )

    const root = screen.getByTestId("note")
    expect(root).toHaveClass("mb-6")
    expect(root).toHaveClass("bg-red-500/10")
    expect(root).toHaveAttribute("role", "alert")
    expect(root).toHaveAttribute("data-slot", "note")
  })
})
