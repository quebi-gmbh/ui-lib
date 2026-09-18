/**
 * Async Multiple Select — the same control, a different source of options.
 *
 * Since task #157 both multi-value pickers draw `MultiSelectControl`, so the
 * shape assertions here are deliberately the same ones as in
 * `multiple-select.test.tsx`: typing filters (here by re-querying the source),
 * the selection is removable chips inside the box, and the whole box opens the
 * dropdown. What is only true here is the half this component owns — that the
 * search reaches `load`, and that a second page arrives on scroll.
 */
import { describe, expect, test } from "bun:test"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  AsyncMultipleSelect,
  type AsyncMultipleSelectLoadParams,
} from "../../src/components/async-multiple-select"

const frameworks = [
  { id: "react", name: "React" },
  { id: "vue", name: "Vue" },
  { id: "svelte", name: "Svelte" },
]

/** A source that filters in memory and reports what it was asked for. */
function source() {
  const calls: AsyncMultipleSelectLoadParams[] = []
  return {
    calls,
    load: async (params: AsyncMultipleSelectLoadParams) => {
      calls.push(params)
      const search = params.search.toLowerCase()
      return {
        items: frameworks.filter((f) => f.name.toLowerCase().includes(search)),
      }
    },
  }
}

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
const optionNames = () => screen.queryAllByRole("option").map((o) => o.textContent?.trim())
const opened = () => waitFor(() => expect(screen.queryByRole("listbox")).not.toBeNull())

describe("AsyncMultipleSelect", () => {
  test("the whole box opens the dropdown and the options come from load()", async () => {
    const user = userEvent.setup()
    const remote = source()
    render(<AsyncMultipleSelect aria-label="Frameworks" load={remote.load} searchDelay={0} />)

    await user.click(box())

    expect(input()).toHaveFocus()
    await opened()
    await waitFor(() => expect(optionNames()).toEqual(["React", "Vue", "Svelte"]))
    expect(remote.calls[0].search).toBe("")
  })

  test("typing re-queries the source and filters the list", async () => {
    const user = userEvent.setup()
    const remote = source()
    render(<AsyncMultipleSelect aria-label="Frameworks" load={remote.load} searchDelay={0} />)

    await user.click(input())
    await opened()
    await user.keyboard("sv")

    await waitFor(() => expect(optionNames()).toEqual(["Svelte"]))
    expect(remote.calls.at(-1)?.search).toBe("sv")
  })

  test("choosing an option adds a removable chip inside the box", async () => {
    const user = userEvent.setup()
    const remote = source()
    render(<AsyncMultipleSelect aria-label="Frameworks" load={remote.load} searchDelay={0} />)

    await user.click(input())
    await opened()
    await user.click(await screen.findByRole("option", { name: "Vue" }))

    await waitFor(() => expect(chips()).toEqual(["Vue"]))
    expect(input()).toHaveFocus()

    await user.click(screen.getByRole("button", { name: "Remove Vue" }))

    await waitFor(() => expect(chips()).toEqual([]))
  })

  test("a named field submits one hidden input per selection", async () => {
    const remote = source()
    const { container } = render(
      <AsyncMultipleSelect
        aria-label="Frameworks"
        load={remote.load}
        name="frameworks"
        defaultValue={[frameworks[0], frameworks[2]]}
      />,
    )

    // The first page lands whether or not the field was opened; waiting for it
    // keeps that state update inside the test rather than after it.
    await waitFor(() => expect(remote.calls).toHaveLength(1))

    const hidden = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="frameworks"]'),
    ).map((el) => el.value)

    expect(hidden).toEqual(["react", "svelte"])
  })

  test("scrolling the results asks the source for the next page", async () => {
    const user = userEvent.setup()
    const calls: AsyncMultipleSelectLoadParams[] = []
    const load = async (params: AsyncMultipleSelectLoadParams) => {
      calls.push(params)
      return params.cursor
        ? { items: [{ id: "solid", name: "Solid" }] }
        : { items: frameworks, cursor: "page-2" }
    }
    render(<AsyncMultipleSelect aria-label="Frameworks" load={load} searchDelay={0} />)

    await user.click(input())
    await opened()
    await waitFor(() => expect(optionNames()).toEqual(["React", "Vue", "Svelte"]))

    // happy-dom reports every box as zero-sized, so any scroll event is "near
    // the bottom" — which is all this asserts: the control reports the scroll
    // and this component turns it into the next page.
    fireEvent.scroll(screen.getByRole("listbox"))

    await waitFor(() => expect(calls.at(-1)?.cursor).toBe("page-2"))
    await waitFor(() => expect(optionNames()).toContain("Solid"))
  })

  test("a disabled field never opens", async () => {
    const user = userEvent.setup()
    const remote = source()
    render(<AsyncMultipleSelect aria-label="Frameworks" load={remote.load} isDisabled />)

    await waitFor(() => expect(remote.calls).toHaveLength(1))
    await user.click(box())

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
