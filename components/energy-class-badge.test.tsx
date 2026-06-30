import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { EnergyClassBadge } from "./energy-class-badge"

test("renders the class letter as visible text (colour is never the sole signal)", () => {
  render(<EnergyClassBadge energyClass="A" data-testid="badge" />)
  const badge = screen.getByTestId("badge")
  expect(badge).toHaveTextContent("A")
  expect(badge).toHaveClass("bg-energy-a")
})

test("normalises case and whitespace to the canonical band", () => {
  render(<EnergyClassBadge energyClass="  c " data-testid="badge" />)
  const badge = screen.getByTestId("badge")
  expect(badge).toHaveTextContent("C")
  expect(badge).toHaveClass("bg-energy-c")
})

test.each([
  ["A", "text-white"],
  ["B", "text-black"],
  ["C", "text-black"],
  ["D", "text-black"],
  ["E", "text-black"],
  ["F", "text-black"],
  ["G", "text-white"],
] as const)("band %s uses fixed contrast text colour %s", (cls, textClass) => {
  render(<EnergyClassBadge energyClass={cls} data-testid="badge" />)
  const badge = screen.getByTestId("badge")
  expect(badge).toHaveClass(`bg-energy-${cls.toLowerCase()}`)
  expect(badge).toHaveClass(textClass)
})

test("unknown / legacy values render verbatim on a neutral chip", () => {
  render(<EnergyClassBadge energyClass="A+" data-testid="badge" />)
  const badge = screen.getByTestId("badge")
  expect(badge).toHaveTextContent("A+")
  expect(badge).toHaveClass("bg-ink-100")
  expect(badge).not.toHaveClass("bg-energy-a")
})

test("forwards aria-label for a fuller screen-reader description", () => {
  render(<EnergyClassBadge energyClass="A" aria-label="Energy efficiency class A" />)
  expect(screen.getByLabelText("Energy efficiency class A")).toHaveTextContent("A")
})

test("applies a custom className alongside band tokens", () => {
  render(<EnergyClassBadge energyClass="A" className="ml-2" data-testid="badge" />)
  const badge = screen.getByTestId("badge")
  expect(badge).toHaveClass("ml-2")
  expect(badge).toHaveClass("bg-energy-a")
})
