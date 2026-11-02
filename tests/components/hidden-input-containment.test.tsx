/**
 * Where a toggle's hidden input is laid out (task #250).
 *
 * react-aria renders the real `<input>` of a Checkbox, Radio or Switch visually
 * hidden, with `position: absolute`. An absolutely positioned element is laid
 * out against its nearest positioned ancestor, and focusing it — which a click
 * on the control does — scrolls every scrollable ancestor until it is in view.
 * `overflow-hidden` is scrollable. So when the nearest positioned ancestor was
 * the modal frame (`relative overflow-hidden`) rather than the control, a
 * click on the last checkbox in a tall dialog slid the whole frame up and left
 * a blank band where the header had been.
 *
 * happy-dom does no layout, so the scroll itself is the browser regression in
 * scripts/hidden-input-scroll.ts. What can be checked here is the cause: walk
 * up from each hidden input and the first ancestor carrying a position class
 * must be the control's own root — the `<label>` react-aria renders it in —
 * and never the body or the frame above it. Each control is rendered where the
 * bug lived, inside `ModalContent > ModalBody`.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Checkbox, CheckboxGroup } from "../../src/components/checkbox"
import { ChoiceBox, ChoiceBoxItem } from "../../src/components/choice-box"
import { GridList, GridListItem } from "../../src/components/grid-list"
import { ModalBody, ModalContent, ModalTitle } from "../../src/components/modal"
import { Radio, RadioGroup } from "../../src/components/radio"
import { Switch } from "../../src/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "../../src/components/table"

const POSITIONED = /(?:^|\s)(?:relative|absolute|fixed|sticky)(?:\s|$)/

/** The nearest ancestor whose class list positions it, or null. */
function positionedAncestor(element: Element): Element | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (POSITIONED.test(node.getAttribute("class") ?? "")) return node
  }
  return null
}

function inDialog(children: React.ReactNode) {
  render(
    <ModalContent isOpen aria-label="Settings">
      <ModalTitle>Settings</ModalTitle>
      <ModalBody>{children}</ModalBody>
    </ModalContent>,
  )
  return screen.getByRole("dialog")
}

/** Every hidden toggle input in the dialog, with at least `min` of them. */
function hiddenInputs(dialog: Element, min: number): HTMLInputElement[] {
  const inputs = Array.from(
    dialog.querySelectorAll<HTMLInputElement>("input[type=checkbox], input[type=radio]"),
  )
  expect(inputs.length).toBeGreaterThanOrEqual(min)
  return inputs
}

function expectContainedByOwnControl(input: HTMLInputElement) {
  const root = input.closest("label")
  expect(root).not.toBeNull()
  expect(positionedAncestor(input)).toBe(root)
}

describe("a toggle's hidden input is positioned against the control, not the frame", () => {
  test("Checkbox, alone and in a group", () => {
    const dialog = inDialog(
      <>
        <Checkbox>Email me</Checkbox>
        <CheckboxGroup aria-label="Channels">
          <Checkbox value="sms">SMS</Checkbox>
          <Checkbox value="push">Push</Checkbox>
        </CheckboxGroup>
      </>,
    )
    for (const input of hiddenInputs(dialog, 3)) expectContainedByOwnControl(input)
  })

  test("Radio", () => {
    const dialog = inDialog(
      <RadioGroup aria-label="Plan" defaultValue="free">
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
      </RadioGroup>,
    )
    for (const input of hiddenInputs(dialog, 2)) expectContainedByOwnControl(input)
  })

  test("Switch", () => {
    const dialog = inDialog(<Switch>Dark mode</Switch>)
    for (const input of hiddenInputs(dialog, 1)) expectContainedByOwnControl(input)
  })

  test("the selection checkbox in a ChoiceBox card", () => {
    const dialog = inDialog(
      <ChoiceBox aria-label="Add-ons" selectionMode="multiple">
        <ChoiceBoxItem id="backup" label="Backups" description="Nightly, kept 30 days." />
        <ChoiceBoxItem id="sso" label="SSO" description="SAML and OIDC." />
      </ChoiceBox>,
    )
    for (const input of hiddenInputs(dialog, 2)) expectContainedByOwnControl(input)
  })

  test("the selection checkbox in a GridList row", () => {
    const dialog = inDialog(
      <GridList aria-label="Permissions" selectionMode="multiple">
        <GridListItem id="read">Read</GridListItem>
        <GridListItem id="write">Write</GridListItem>
      </GridList>,
    )
    for (const input of hiddenInputs(dialog, 2)) expectContainedByOwnControl(input)
  })

  test("the selection checkboxes in a Table header and rows", () => {
    const dialog = inDialog(
      <Table aria-label="Devices" selectionMode="multiple">
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="1">
            <TableCell>Galaxy S24</TableCell>
          </TableRow>
          <TableRow id="2">
            <TableCell>Pixel 9</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    // One in the header (select all), one per row.
    for (const input of hiddenInputs(dialog, 3)) expectContainedByOwnControl(input)
  })
})

describe("the frame around them", () => {
  test("the body is a positioning context, because it is the box that scrolls", () => {
    const dialog = inDialog(<Checkbox>Email me</Checkbox>)
    const body = dialog.querySelector("[data-slot=dialog-body]")
    expect(body).toHaveClass("relative", "overflow-auto")
  })

  test("the frame clips with overflow-clip, which cannot be scrolled at all", () => {
    // The second line of defence: an input that still escapes — from a
    // third-party widget, say — finds a frame with no scroll position to move.
    const dialog = inDialog(<Checkbox>Email me</Checkbox>)
    const frame = dialog.closest("[data-slot=modal-content]")
    expect(frame).toHaveClass("overflow-clip")
    expect(frame).not.toHaveClass("overflow-hidden")
  })
})
