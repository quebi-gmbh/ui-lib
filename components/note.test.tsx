import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { Note } from "./note"

test("renders children content", () => {
  render(<Note intent="info">Pricing syncs automatically.</Note>)
  expect(screen.getByText("Pricing syncs automatically.")).toBeInTheDocument()
})

test("renders the title above the body when provided", () => {
  render(
    <Note intent="danger" title="Couldn't publish">
      Fix the highlighted prices.
    </Note>,
  )
  expect(screen.getByText("Couldn't publish")).toBeInTheDocument()
  expect(screen.getByText("Fix the highlighted prices.")).toBeInTheDocument()
})

test("default intent renders no status icon", () => {
  const { container } = render(<Note>Draft plan.</Note>)
  expect(container.querySelector("svg")).toBeNull()
})

test.each([
  "info",
  "success",
  "warning",
  "danger",
] as const)("%s intent renders a status icon by default", (intent) => {
  const { container } = render(<Note intent={intent}>Message</Note>)
  const icon = container.querySelector("svg")
  expect(icon).not.toBeNull()
  expect(icon).toHaveAttribute("aria-hidden", "true")
})

test("indicator={false} hides the icon even for a status intent", () => {
  const { container } = render(
    <Note intent="success" indicator={false}>
      Saved.
    </Note>,
  )
  expect(container.querySelector("svg")).toBeNull()
})

test("applies a custom className alongside intent tokens", () => {
  render(
    <Note intent="danger" className="mb-6" data-testid="note">
      Error
    </Note>,
  )
  const root = screen.getByTestId("note")
  expect(root).toHaveClass("mb-6")
  expect(root).toHaveClass("bg-danger-subtle")
})

test("forwards arbitrary props such as role to the root", () => {
  render(
    <Note intent="warning" role="alert" data-testid="note">
      Out of stock
    </Note>,
  )
  const root = screen.getByTestId("note")
  expect(root).toHaveAttribute("role", "alert")
  expect(root).toHaveAttribute("data-slot", "note")
})
