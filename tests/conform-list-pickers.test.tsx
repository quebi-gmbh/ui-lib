/**
 * The list-backed conform-* pickers own their value.
 *
 * ConformStoragePicker and ConformColorSwatchPicker used to keep the selection
 * in a react-stately list the caller passed and mirror it into
 * `<input type="hidden" value={…} />`. That submits, and nothing else: a reset
 * writes the elements Conform has registered, and a React-controlled mirror is
 * not one of them, so the chips stayed where the user left them while the rest
 * of the form snapped back. The value now lives in a registered control and the
 * list is a projection of it — which is only observable through a reset, an
 * update, and a change made from the list.
 *
 * Split out of `conform-binding.test.tsx`, which pins what *every* variant rests
 * on; this file is about the one thing the two list-backed pickers do that the
 * others do not. They share the by-hand mount from `tests/mount.ts`, and the DOM
 * comes from `tests/dom.ts`, preloaded for every test file (see `bunfig.toml`).
 */
import { afterEach, describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import { act } from "react"
import { useListData } from "react-stately"
import { Button } from "../src/components/button"
import { ConformColorSwatchPicker } from "../src/components/conform-color-swatch-picker"
import { ConformStoragePicker } from "../src/components/conform-storage-picker"
import { click, formOf, mount, unmountAll } from "./mount"

afterEach(unmountAll)

describe("the list-backed pickers own their value", () => {
  const chip = (container: HTMLElement, text: string) =>
    Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text)

  const press = async (container: HTMLElement, text: string) => {
    await act(async () => {
      chip(container, text)?.click()
    })
  }

  const tags = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[data-testid="tags"] li')).map((li) => li.textContent)

  describe("without a list, the picker is the only owner", () => {
    function App() {
      const [form, fields] = useForm({ defaultValue: { storage: "128GB" } })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformStoragePicker field={fields.storage} label="Storage" />
        </form>
      )
    }

    test("the field's default is the selection, in FormData and in the chips", async () => {
      const container = await mount(<App />)
      expect(new FormData(formOf(container)).get("storage")).toBe("128GB")
      expect(chip(container, "128GB")?.getAttribute("aria-pressed")).toBe("true")
      expect(chip(container, "1TB")?.getAttribute("aria-pressed")).toBe("false")
    })

    test("toggling a chip reaches FormData", async () => {
      const container = await mount(<App />)
      await press(container, "1TB")
      expect(new FormData(formOf(container)).get("storage")).toBe("128GB,1TB")
      await press(container, "128GB")
      expect(new FormData(formOf(container)).get("storage")).toBe("1TB")
    })

    test("a form reset snaps the selection back to the field's default", async () => {
      const container = await mount(<App />)
      await press(container, "1TB")
      const form = formOf(container)
      await act(async () => {
        form.reset()
      })
      expect(new FormData(form).get("storage")).toBe("128GB")
      expect(chip(container, "1TB")?.getAttribute("aria-pressed")).toBe("false")
    })

    // `form.update({ name, value })` is deliberately not asserted here: it
    // reaches the picker by the same route a reset does — Conform writing the
    // registered element — but its intent is dispatched through
    // `form.requestSubmit(submitter)`, and happy-dom's requestSubmit fires no
    // submit event, so the intent never runs. It does not run for a plain
    // <input> in this environment either. Reset is the assertion that covers
    // the route.
  })

  describe("with a list, the list follows the value", () => {
    function App() {
      const list = useListData<{ id: number; name: string }>({ initialItems: [] })
      const [form, fields] = useForm({ defaultValue: { storage: "256GB,1TB" } })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformStoragePicker field={fields.storage} label="Storage" list={list} />
          <ul data-testid="tags">
            {list.items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
          <Button
            type="button"
            data-testid="drop"
            onPress={() => {
              const first = list.items[0]
              if (first) list.remove(first.id)
            }}
          >
            drop
          </Button>
        </form>
      )
    }

    test("the list is seeded from the field, not the other way round", async () => {
      const container = await mount(<App />)
      expect(tags(container)).toEqual(["256GB", "1TB"])
      expect(new FormData(formOf(container)).get("storage")).toBe("256GB,1TB")
    })

    test("a toggle here shows up in the list", async () => {
      const container = await mount(<App />)
      await press(container, "512GB")
      expect(tags(container)).toEqual(["256GB", "1TB", "512GB"])
    })

    test("removing an item elsewhere writes the field", async () => {
      const container = await mount(<App />)
      await click(container, "drop")
      expect(new FormData(formOf(container)).get("storage")).toBe("1TB")
      expect(chip(container, "256GB")?.getAttribute("aria-pressed")).toBe("false")
    })

    test("a form reset re-seeds the list as well as the field", async () => {
      const container = await mount(<App />)
      await click(container, "drop")
      await press(container, "32GB")
      const form = formOf(container)
      await act(async () => {
        form.reset()
      })
      expect(new FormData(form).get("storage")).toBe("256GB,1TB")
      expect(tags(container)).toEqual(["256GB", "1TB"])
    })
  })

  describe("a caller-seeded list is the fallback default, and is canonicalized", () => {
    function App() {
      const list = useListData<{ id: number; name: string }>({
        initialItems: [{ id: 1, name: "512 gb" }],
      })
      const [form, fields] = useForm<{ storage: string }>({})
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformStoragePicker field={fields.storage} label="Storage" list={list} />
          <ul data-testid="tags">
            {list.items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </form>
      )
    }

    test("a field with no default falls back to what the caller seeded", async () => {
      const container = await mount(<App />)
      expect(new FormData(formOf(container)).get("storage")).toBe("512GB")
      // The free-form label is rewritten in the caller's list too, so the keys
      // on the wire are the ones the picker offers.
      expect(tags(container)).toEqual(["512GB"])
      expect(chip(container, "512GB")?.getAttribute("aria-pressed")).toBe("true")
    })
  })

  describe("the colour swatch picker is bound the same way", () => {
    function App() {
      const list = useListData<{ id: number; name: string }>({ initialItems: [] })
      const [form, fields] = useForm({ defaultValue: { colors: ["teal"] } })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformColorSwatchPicker field={fields.colors} label="Colors" list={list} />
          <ul data-testid="tags">
            {list.items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </form>
      )
    }

    const swatch = (container: HTMLElement, key: string) =>
      container.querySelector<HTMLElement>(`[aria-label="${key}"]`)

    test("the field's default selects a swatch and seeds the list", async () => {
      const container = await mount(<App />)
      expect(new FormData(formOf(container)).get("colors")).toBe("teal")
      expect(tags(container)).toEqual(["teal"])
    })

    test("a form reset snaps the selection and the list back", async () => {
      const container = await mount(<App />)
      await act(async () => {
        swatch(container, "red")?.click()
      })
      expect(new FormData(formOf(container)).get("colors")).toBe("teal,red")
      expect(tags(container)).toEqual(["teal", "red"])

      const form = formOf(container)
      await act(async () => {
        form.reset()
      })
      expect(new FormData(form).get("colors")).toBe("teal")
      expect(tags(container)).toEqual(["teal"])
    })
  })
})
