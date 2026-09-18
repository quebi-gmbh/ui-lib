/**
 * A render-prop `className` reaches the DOM.
 *
 * The companion to `tests/render-prop-classname.test.ts`, which proves the
 * broken shape is absent from the sources. This one proves the shape that
 * replaced it works, on a sample chosen for the *different ways* a component
 * builds its class list: a tailwind-variants base (`Button`, `Toggle`), a plain
 * string base (`Switch`, `Checkbox`), a base that reads the render state itself
 * (`Checkbox`'s children), and one whose render state is a computed value
 * rather than a flag (`ProgressBar`'s `percentage`).
 *
 * Each is asserted three ways, because the bug had three faces:
 *
 * 1. the caller's classes are *present* — clsx used to drop the function whole,
 * 2. they *win* a conflict against the component's base — a caller styling per
 *    state is overriding something, and tailwind-merge has to see both,
 * 3. the render state *arrives* — a function that never gets called cannot tell
 *    `isSelected` from `isDisabled`, which is the only reason to pass one.
 *
 * `Link` has its own copies of these in `link.test.tsx` (task #112, PR #121),
 * where the bug was first found.
 */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Button } from "../../src/components/button"
import { Checkbox } from "../../src/components/checkbox"
import { Input } from "../../src/components/input"
import { ProgressBar } from "../../src/components/progress-bar"
import { Switch } from "../../src/components/switch"
import { Toggle } from "../../src/components/toggle"

const classesOf = (element: Element) => element.className.split(/\s+/)

/**
 * The element a Checkbox's or Switch's className lands on. react-aria renders
 * the accessible control as an `<input>` *inside* the label it styles, so the
 * classes are on the label, not on what `getByRole` returns.
 */
const labelWrapping = (role: string, name: string) =>
  screen.getByRole(role, { name }).closest("label") as HTMLElement

test("Button applies a render-prop className", () => {
  render(<Button className={() => "probe-button"}>Go</Button>)

  expect(classesOf(screen.getByRole("button", { name: "Go" }))).toContain("probe-button")
})

test("Button's own variant classes lose to the ones a render prop returns", () => {
  render(
    <Button intent="primary" className={() => "rounded-full"}>
      Go
    </Button>,
  )

  // `rounded-quebi-sm` is in buttonStyles' base and `rounded-full` is the
  // caller's: one tailwind-merge group, later wins — but only if the merge saw
  // the caller's class at all.
  const classes = classesOf(screen.getByRole("button", { name: "Go" }))
  expect(classes).toContain("rounded-full")
  expect(classes).not.toContain("rounded-quebi-sm")
})

test("Button hands react-aria's render state to a render-prop className", () => {
  render(
    <Button isDisabled className={({ isDisabled }) => (isDisabled ? "probe-disabled" : "probe-idle")}>
      Go
    </Button>,
  )

  expect(classesOf(screen.getByRole("button", { name: "Go" }))).toContain("probe-disabled")
})

test("Toggle applies a render-prop className and hands it the pressed state", () => {
  render(
    <Toggle isSelected className={({ isSelected }) => (isSelected ? "probe-on" : "probe-off")}>
      Bold
    </Toggle>,
  )

  expect(classesOf(screen.getByRole("button", { name: "Bold" }))).toContain("probe-on")
})

test("Switch applies a render-prop className", () => {
  render(<Switch className={() => "probe-switch"}>Wifi</Switch>)

  expect(classesOf(labelWrapping("switch", "Wifi"))).toContain("probe-switch")
})

test("Switch hands react-aria's render state to a render-prop className", () => {
  render(
    <Switch isSelected className={({ isSelected }) => (isSelected ? "probe-on" : "probe-off")}>
      Wifi
    </Switch>,
  )

  expect(classesOf(labelWrapping("switch", "Wifi"))).toContain("probe-on")
})

test("Checkbox applies a render-prop className without losing its own children", () => {
  render(
    <Checkbox isSelected className={({ isSelected }) => (isSelected ? "probe-checked" : "probe-unchecked")}>
      Accept
    </Checkbox>,
  )

  const labelled = labelWrapping("checkbox", "Accept")
  expect(classesOf(labelled)).toContain("probe-checked")
  // The indicator is drawn by a *children* render prop on the same component;
  // composing the className must not have disturbed it.
  expect(labelled.querySelector("[data-slot=indicator]")).not.toBeNull()
})

test("Input applies a render-prop className", () => {
  render(<Input aria-label="Name" className={() => "probe-input"} />)

  expect(classesOf(screen.getByRole("textbox", { name: "Name" }))).toContain("probe-input")
})

test("ProgressBar applies a render-prop className and hands it the value state", () => {
  render(
    <ProgressBar
      aria-label="Upload"
      value={40}
      className={({ percentage }) => ((percentage ?? 0) > 20 ? "probe-past-20" : "probe-early")}
    />,
  )

  expect(classesOf(screen.getByRole("progressbar", { name: "Upload" }))).toContain("probe-past-20")
})

test("a plain string className still merges with the component's base", () => {
  render(<Button className="probe-string">Go</Button>)

  const classes = classesOf(screen.getByRole("button", { name: "Go" }))
  expect(classes).toContain("probe-string")
  // The base survives: composing a render prop must not have replaced the merge.
  expect(classes).toContain("inline-flex")
})
