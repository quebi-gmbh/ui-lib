/**
 * Multiple Select — the shape it shares with Async Multiple Select.
 *
 * Since task #157 this is a tokenizer combobox: chips and one text input inside
 * the control box, a non-modal popover, and virtual focus over the results. So
 * what is worth pinning is the shape itself — typing filters, the selection is
 * removable chips *inside* the box, and the whole box (padding or chip body,
 * not just the input) opens the dropdown, which is what task #116 fixed for the
 * old shape and must not regress in this one.
 *
 * The rest of these are the guarantees the old tests made, restated for a
 * combobox: focus opens, ArrowDown opens, Escape stays closed, removing a chip
 * does not open, a disabled field never opens, choosing an option adds a chip.
 * Two of them change shape on purpose and say so: there is no `+` button any
 * more, and Space types a space rather than opening the list.
 *
 * The popover is non-modal, so nothing outside it is hidden and the input stays
 * queryable by role the whole time.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  MultipleSelect,
  MultipleSelectContent,
  MultipleSelectItem,
} from "../../src/components/multiple-select"

const frameworks = [
  { id: "react", name: "React" },
  { id: "vue", name: "Vue" },
  { id: "svelte", name: "Svelte" },
]

function Fixture({
  defaultValue,
  isDisabled,
  name,
}: {
  defaultValue?: string[]
  isDisabled?: boolean
  name?: string
}) {
  return (
    <MultipleSelect
      aria-label="Frameworks"
      placeholder="Select frameworks"
      defaultValue={defaultValue}
      isDisabled={isDisabled}
      name={name}
    >
      <MultipleSelectContent items={frameworks}>
        {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
      </MultipleSelectContent>
    </MultipleSelect>
  )
}

/** The input is the control; the box is the element that holds it and the chips. */
const input = () => screen.getByRole("combobox", { name: "Frameworks" })
const box = () => {
  const el = input().parentElement
  if (!el) throw new Error("control box not found")
  return el
}
const chips = () =>
  Array.from(box().querySelectorAll<HTMLElement>('[data-slot="chip"]')).map((chip) =>
    chip.textContent?.trim(),
  )
const removeChip = (name: string) => within(box()).getByRole("button", { name: `Remove ${name}` })
const optionNames = () => screen.queryAllByRole("option").map((o) => o.textContent?.trim())

const isOpen = () => screen.queryByRole("listbox") !== null
const opened = () => waitFor(() => expect(isOpen()).toBe(true))
const closed = () => waitFor(() => expect(isOpen()).toBe(false))

/** Long enough for a stray open/close to have landed, had one been queued. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe("MultipleSelect", () => {
  test("typing in the box filters the options", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(input())
    await opened()
    expect(optionNames()).toEqual(["React", "Vue", "Svelte"])

    await user.keyboard("sv")

    await waitFor(() => expect(optionNames()).toEqual(["Svelte"]))
    expect(input()).toHaveValue("sv")
  })

  test("the selection renders as removable chips inside the box", async () => {
    const user = userEvent.setup()
    render(<Fixture defaultValue={["react", "vue"]} />)

    expect(chips()).toEqual(["React", "Vue"])

    await user.click(removeChip("React"))

    await waitFor(() => expect(chips()).toEqual(["Vue"]))
    // Removing a chip is not a way into the menu (it never was — task #116).
    await settle()
    expect(isOpen()).toBe(false)
  })

  test("the whole box opens the dropdown, not only the input", async () => {
    const user = userEvent.setup()
    render(<Fixture defaultValue={["react"]} />)

    expect(isOpen()).toBe(false)
    // The bare surface of the box: not the input, not a chip's ✕.
    await user.click(box())
    await opened()
    expect(input()).toHaveFocus()
  })

  test("pressing a chip's label opens the dropdown too", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture defaultValue={["react"]} />)
    const chip = container.querySelector<HTMLElement>('[data-slot="chip"]')
    if (!chip) throw new Error("no chip rendered")

    await user.click(chip)

    await opened()
    expect(input()).toHaveFocus()
  })

  test("opens when the field takes keyboard focus", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.tab()

    expect(input()).toHaveFocus()
    await opened()
  })

  test("ArrowDown opens a closed field and then walks the options", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(input())
    await opened()
    await user.keyboard("{Escape}")
    await closed()

    await user.keyboard("{ArrowDown}")
    await opened()
    // Virtual focus: the input keeps DOM focus and points at the active option.
    expect(input()).toHaveFocus()
    const active = () => input().getAttribute("aria-activedescendant")
    const first = active()
    expect(first).not.toBeNull()

    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(active()).not.toBe(first))
  })

  test("closing with Escape does not re-open — focus never left the input", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(box())
    await opened()
    await user.keyboard("{Escape}")
    await closed()

    await settle()
    expect(isOpen()).toBe(false)
    expect(input()).toHaveFocus()
  })

  test("a disabled field never opens", async () => {
    const user = userEvent.setup()
    render(<Fixture isDisabled />)

    await user.click(box())

    await settle()
    expect(isOpen()).toBe(false)
  })

  test("choosing an option adds a chip and keeps focus in the input", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(box())
    await opened()
    await user.click(screen.getByRole("option", { name: "Vue" }))

    await waitFor(() => expect(chips()).toEqual(["Vue"]))
    expect(isOpen()).toBe(true)
    expect(input()).toHaveFocus()
    // Choosing again is a toggle, as the check mark in the row says.
    await user.click(screen.getByRole("option", { name: "Vue" }))
    await waitFor(() => expect(chips()).toEqual([]))
  })

  test("Backspace on an empty input removes the last chip", async () => {
    const user = userEvent.setup()
    render(<Fixture defaultValue={["react", "vue"]} />)

    await user.click(input())
    await user.keyboard("{Backspace}")

    await waitFor(() => expect(chips()).toEqual(["React"]))
  })

  test("Space types a space — it is a character now, not a trigger key", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(input())
    await opened()
    await user.keyboard("re[Space]")

    expect(input()).toHaveValue("re ")
  })

  test("a named field submits one hidden input per selection", async () => {
    const { container } = render(<Fixture defaultValue={["react", "vue"]} name="frameworks" />)

    const hidden = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="frameworks"]'),
    ).map((el) => el.value)

    expect(hidden).toEqual(["react", "vue"])
  })

  test("there is no separate add button — the input is the trigger", () => {
    const { container } = render(<Fixture defaultValue={["react"]} />)

    // Every button in the box is a chip's ✕; the `+` of the old shape is gone.
    const labels = Array.from(container.querySelectorAll("button")).map((b) =>
      b.getAttribute("aria-label"),
    )
    expect(labels).toEqual(["Remove React"])
  })
})
