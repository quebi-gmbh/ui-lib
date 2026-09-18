/**
 * Multiple Select — who opens the dropdown.
 *
 * The control box is a div holding removable tags and a `+` button, and
 * react-aria hands the select's open state to the button alone. So the thing
 * worth testing is that the *box* opens the menu too — and that the three
 * things which must not open it still do not: the `+` (which toggles, so an
 * open from the box would be cancelled by the button's own press), a tag's ✕,
 * and react-aria restoring focus to the box as the popover closes.
 *
 * While the popover is open react-aria marks everything outside it `aria-hidden`
 * and `inert`, and `getByRole` skips hidden elements — so the control's own
 * parts are found by plain DOM queries against the render container rather than
 * by role.
 */
import { describe, expect, test } from "bun:test"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
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
}: {
  defaultValue?: string[]
  isDisabled?: boolean
}) {
  return (
    <MultipleSelect
      aria-label="Frameworks"
      placeholder="Select frameworks"
      defaultValue={defaultValue}
      isDisabled={isDisabled}
    >
      <MultipleSelectContent items={frameworks}>
        {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
      </MultipleSelectContent>
    </MultipleSelect>
  )
}

/** The whole rendered control: the box, its tab stop, its buttons. */
function control(container: HTMLElement) {
  const addButton = container.querySelector<HTMLElement>('button[aria-haspopup="listbox"]')
  if (!addButton?.parentElement) throw new Error("control box not found")
  const box = addButton.parentElement
  return {
    box,
    addButton,
    /** The field's own tab stop — the tag list react-aria makes focusable. */
    tabStop: () => {
      const el = box.querySelector<HTMLElement>('[tabindex="0"]')
      if (!el) throw new Error("no tab stop in the control box")
      return el
    },
    removeButton: (name: string) => {
      const el = within(box)
        .getByText(name)
        .closest("[data-rac]")
        ?.querySelector<HTMLElement>("button")
      if (!el) throw new Error(`no remove button on the ${name} tag`)
      return el
    },
    tags: () => within(box).queryAllByRole("row").map((row) => row.textContent),
  }
}

// The popover is identified by the one control only it contains: the search box.
const isOpen = () => screen.queryByRole("searchbox", { name: "Search items" }) !== null
const opened = () => waitFor(() => expect(isOpen()).toBe(true))
const closed = () => waitFor(() => expect(isOpen()).toBe(false))

/** Long enough for a stray open/close to have landed, had one been queued. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe("MultipleSelect", () => {
  test("opens when the box is clicked, not only the + button", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture />)

    expect(isOpen()).toBe(false)
    await user.click(control(container).box)
    await opened()
  })

  test("opens when the + button is pressed, and does not close again", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture />)

    await user.click(control(container).addButton)
    await opened()
    // The box's open must not be undone by the button's own toggle.
    await settle()
    expect(isOpen()).toBe(true)
  })

  test("opens when the field takes keyboard focus", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.tab()
    await opened()
  })

  // Focus alone already opens the menu, so a keyboard test cannot get to a
  // focused-but-closed field through the user's own route. The keys are
  // dispatched at the field's tab stop directly instead — the shape a user
  // reaches by pressing Escape and then ArrowDown without leaving the field.
  for (const key of ["ArrowDown", "ArrowUp", "Enter", " "]) {
    test(`opens on ${key === " " ? "Space" : key} on the field`, async () => {
      const { container } = render(<Fixture />)

      expect(isOpen()).toBe(false)
      fireEvent.keyDown(control(container).tabStop(), { key })
      await opened()
    })
  }

  test("closing with Escape does not re-open on the focus react-aria restores", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture />)

    await user.click(control(container).box)
    await opened()
    await user.keyboard("{Escape}")
    await closed()

    await settle()
    expect(isOpen()).toBe(false)
  })

  test("removing a tag does not open the dropdown", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture defaultValue={["react", "vue"]} />)
    const field = control(container)

    expect(field.tags()).toEqual(["React", "Vue"])
    await user.click(field.removeButton("React"))

    await waitFor(() => expect(field.tags()).toEqual(["Vue"]))
    await settle()
    expect(isOpen()).toBe(false)
  })

  test("a disabled field never opens", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture isDisabled />)

    await user.click(control(container).box)
    await settle()
    expect(isOpen()).toBe(false)
  })

  test("selecting from the list adds a tag", async () => {
    const user = userEvent.setup()
    const { container } = render(<Fixture />)
    const field = control(container)

    await user.click(field.box)
    await opened()
    await user.click(screen.getByRole("option", { name: "Vue" }))

    await waitFor(() => expect(field.tags()).toEqual(["Vue"]))
  })
})
