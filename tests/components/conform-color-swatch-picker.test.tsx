/**
 * ConformColorSwatchPicker announces its selection.
 *
 * The regression this pins (task #15): the grid used to be built on the quebi
 * ColorSwatchPicker, which wraps react-aria's — and that component hardcodes
 * `selectionMode: "single"` and derives its selection from a single color
 * *value*, so a multi-select grid on top of it rendered every swatch as
 * `role="option" aria-selected="false"`, the selected ones included. A ring
 * drawn by hand said one thing and the accessibility tree said another, which
 * is worse than saying nothing.
 *
 * So these assertions are deliberately about the announced state — the role,
 * `aria-selected`, `aria-multiselectable` — and about the value that leaves in
 * FormData, never about the ring's class. A class assertion would have passed
 * throughout the bug.
 */
import { describe, expect, test } from "bun:test"
import { getFormProps, useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useListData } from "react-stately"
import * as v from "valibot"
import { Button } from "../../src/components/button"
import { ConformColorSwatchPicker } from "../../src/components/conform-color-swatch-picker"

const schema = v.object({
  colors: v.pipe(
    v.unknown(),
    v.transform((value) =>
      typeof value === "string" ? value.split(",").filter(Boolean) : ([] as string[]),
    ),
    v.minLength(1, "Pick at least one color"),
  ),
})

function TestForm({ initial = ["teal"] as string[] }) {
  const list = useListData<{ id: number; name: string }>({
    initialItems: initial.map((name, index) => ({ id: index + 1, name })),
  })

  const [form, fields] = useForm({
    id: "colors-form",
    onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
    onSubmit: (event) => event.preventDefault(),
  })

  return (
    // A raw <form> is what `getFormProps` is for; the library's own rule points
    // callers at react-router's <Form>, which would need a router around every
    // test in this file to prove nothing about the component. That is the rule's
    // own published exception, and in this repo it is a `localScopes` entry
    // naming <form> alone — so every other element on the tier-1 list is still
    // checked in this file.
    <form {...getFormProps(form)}>
      <ConformColorSwatchPicker
        field={fields.colors}
        list={list}
        label="Device colors"
        description="Pick the colors this device ships in"
      />
      {/* Removing a tag elsewhere on the page is the case `list` exists for. */}
      <Button type="button" onPress={() => list.remove(1)}>
        Remove the first tag
      </Button>
      <Button type="submit">Save</Button>
    </form>
  )
}

/**
 * Render the fixture and query *inside* it. The DOM is one global shared by
 * every test file in the run, so a document-wide `getByRole` (or a
 * `document.querySelector("form")`) can be answered by another file's leftovers.
 */
function renderForm(props: { initial?: string[] } = {}) {
  const { container } = render(<TestForm {...props} />)
  const form = container.querySelector("form") as HTMLFormElement
  const q = within(container)
  return {
    listbox: () => q.getByRole("listbox", { name: "Device colors" }),
    swatch: (name: string) => q.getByRole("option", { name }),
    press: (name: string) => q.getByRole("button", { name }),
    submitted: () => new FormData(form).get("colors"),
  }
}

describe("ConformColorSwatchPicker", () => {
  test("the swatches are a multi-selectable listbox, not ten lone options", () => {
    const { listbox } = renderForm()

    expect(listbox()).toHaveAttribute("aria-multiselectable", "true")
  })

  test("the selected swatch reports the selection, and the others report none", () => {
    const { swatch, submitted } = renderForm()

    expect(swatch("teal")).toHaveAttribute("aria-selected", "true")
    expect(swatch("red")).toHaveAttribute("aria-selected", "false")
    expect(submitted()).toBe("teal")
  })

  test("selecting a second swatch announces it and adds it to the value", async () => {
    const user = userEvent.setup()
    const { swatch, submitted } = renderForm()

    await user.click(swatch("red"))

    expect(swatch("red")).toHaveAttribute("aria-selected", "true")
    // Multi-select: the first one is still selected, which is the whole point.
    expect(swatch("teal")).toHaveAttribute("aria-selected", "true")
    expect(submitted()).toBe("teal,red")
  })

  test("clicking a selected swatch deselects it, in the value and in the announcement", async () => {
    const user = userEvent.setup()
    const { swatch, submitted } = renderForm()

    await user.click(swatch("teal"))

    expect(swatch("teal")).toHaveAttribute("aria-selected", "false")
    expect(submitted()).toBe("")
  })

  test("the keyboard toggles a swatch, so the grid is usable without a pointer", async () => {
    const user = userEvent.setup()
    const { swatch, submitted } = renderForm()

    // Tab enters the listbox at the selected option; the arrow moves one step
    // across the grid, and Space toggles what it lands on. All three come from
    // the listbox, and none of them existed while the grid faked its selection.
    await user.tab()
    expect(document.activeElement).toBe(swatch("teal"))

    await user.keyboard("{ArrowRight}{ }")

    expect(swatch("blue")).toHaveAttribute("aria-selected", "true")
    expect(swatch("teal")).toHaveAttribute("aria-selected", "true")
    expect(submitted()).toBe("teal,blue")
  })

  test("a tag removed elsewhere on the page deselects its swatch", async () => {
    const user = userEvent.setup()
    const { swatch, press, submitted } = renderForm()

    await user.click(press("Remove the first tag"))

    expect(swatch("teal")).toHaveAttribute("aria-selected", "false")
    expect(submitted()).toBe("")
  })

  test("the error is announced by the listbox itself", async () => {
    const user = userEvent.setup()
    const { listbox, press } = renderForm({ initial: [] })

    await user.click(press("Save"))

    expect(listbox()).toHaveAccessibleDescription(/Pick at least one color/)
  })

  test("the description is announced before there is an error", () => {
    const { listbox } = renderForm()

    expect(listbox()).toHaveAccessibleDescription(/Pick the colors this device ships in/)
  })
})
