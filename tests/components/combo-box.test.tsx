/**
 * When the combo box list opens.
 *
 * react-aria's own default is `menuTrigger="input"`: the list stays shut until
 * the first keystroke, which therefore both reveals and filters it, and a
 * keyboard user who tabs in gets no signal that a list exists. `ComboBox`
 * defaults the prop to `"focus"` instead, and — because it is a default, not a
 * hard-coding — a caller who wants react-aria's behaviour can still ask for it.
 *
 * The chevron is the other half of "how do I open this list": it used to be
 * hidden whenever the input held text, leaving the toggle button invisible but
 * still clickable over the end of the field.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComboBoxProps } from "../../src/components/combo-box"
import {
  ComboBox,
  ComboBoxContent,
  ComboBoxInput,
  ComboBoxItem,
} from "../../src/components/combo-box"

const fruits = [
  { id: "apple", name: "Apple" },
  { id: "banana", name: "Banana" },
  { id: "cherry", name: "Cherry" },
]

const Fruit = (props: Partial<ComboBoxProps<(typeof fruits)[number]>>) => (
  <ComboBox aria-label="Fruit" {...props}>
    <ComboBoxInput placeholder="Search fruit..." />
    <ComboBoxContent items={fruits}>
      {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
    </ComboBoxContent>
  </ComboBox>
)

const input = () => screen.getByRole("combobox", { name: "Fruit" })

describe("ComboBox opening", () => {
  test("opens on focus, before anything is typed", async () => {
    render(<Fruit />)
    expect(input()).toHaveAttribute("aria-expanded", "false")

    await userEvent.tab()

    expect(input()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument()
  })

  test("shows the whole list on focus, not one filtered by the selected value", async () => {
    render(<Fruit defaultSelectedKey="cherry" />)

    await userEvent.tab()

    expect(screen.getAllByRole("option")).toHaveLength(fruits.length)
  })

  test('menuTrigger="input" still gets react-aria\'s default: shut until you type', async () => {
    render(<Fruit menuTrigger="input" />)

    await userEvent.tab()

    expect(input()).toHaveAttribute("aria-expanded", "false")

    await userEvent.keyboard("ba")

    expect(input()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getAllByRole("option")).toHaveLength(1)
  })
})

describe("ComboBox chevron", () => {
  test("stays visible once the field holds text, so the toggle is never invisible", async () => {
    render(<Fruit />)

    const toggle = screen.getByRole("button")
    expect(toggle.querySelector("svg")).toBeInTheDocument()

    await userEvent.click(input())
    await userEvent.keyboard("ap")

    expect(toggle.querySelector("svg")).toBeInTheDocument()
  })
})
