/**
 * The two things every conform-* variant rests on, asserted against a real DOM.
 *
 * Both are silent when broken — no type error, no React warning, no missing
 * attribute — which is exactly why they are tested rather than reviewed:
 *
 *   1. The bridge between Conform's v1 `useForm` and the `useControl` /
 *      `BaseControl` pair from `@conform-to/react/future`, which is what the
 *      hidden-input variants (TimeField, DateRangePicker, FileTrigger,
 *      ChoiceBox, Calendar, DaySchedule, ColorPicker) are built on.
 *   2. That the metadata is read attribute by attribute rather than spread from
 *      `getInputProps`, because react-aria's prop names differ from the DOM's
 *      and `filterDOMProps` drops the mismatched half without complaint.
 *
 * The third block pins react-aria's id ownership, which is what decides where
 * each variant puts `id={field.errorId}`.
 *
 * The DOM comes from `tests/dom.ts`, preloaded for every test file (see
 * `bunfig.toml`); happy-dom refuses a second global registration, so this file
 * no longer registers its own. It keeps mounting through `createRoot` by hand
 * rather than through React Testing Library because what it asserts is the
 * hand-off between Conform and react-aria, which is easier to read as explicit
 * mount / act steps.
 */
import { afterEach, describe, expect, test } from "bun:test"
import { type FieldMetadata, getInputProps, useForm } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { parseWithValibot } from "@conform-to/valibot"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { FieldError, Input, Label, TextField } from "react-aria-components"
import { useListData } from "react-stately"
import * as v from "valibot"
import { ConformColorSwatchPicker } from "../src/components/conform-color-swatch-picker"
import { ConformField } from "../src/components/conform-field"
import { ConformStoragePicker } from "../src/components/conform-storage-picker"
import { ConformSwitch } from "../src/components/conform-switch"
import { Switch } from "../src/components/switch"

// Mounting by hand means unmounting by hand: React Testing Library's automatic
// cleanup (tests/dom.ts) only knows about containers *it* created, and the DOM
// is one global shared by every file in the run. Left in place, the forms below
// stay in document.body for whatever file happens to run next, where a
// `document.querySelector("form")` finds this file's form and a `user.tab()`
// walks into this file's inputs.
const mounted: Array<{ container: HTMLElement; unmount: () => void }> = []

async function mount(element: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(element)
  })
  mounted.push({ container, unmount: () => root.unmount() })
  return container
}

afterEach(() => {
  for (const { container, unmount } of mounted.splice(0)) {
    act(() => {
      unmount()
    })
    container.remove()
  }
})

const formOf = (container: HTMLElement) => container.querySelector("form") as HTMLFormElement
const click = async (container: HTMLElement, testId: string) => {
  await act(async () => {
    container.querySelector<HTMLElement>(`[data-testid="${testId}"]`)?.click()
  })
}

describe("the v1 useForm <-> future useControl bridge", () => {
  function Custom({ field }: { field: FieldMetadata<string> }) {
    const control = useControl({ defaultValue: field.initialValue as string | undefined })
    return (
      <>
        <BaseControl
          name={field.name}
          form={field.formId}
          ref={control.register}
          defaultValue={control.defaultValue ?? ""}
        />
        <button type="button" data-testid="set" onClick={() => control.change("banana")}>
          set
        </button>
        <span data-testid="value">{control.value ?? ""}</span>
      </>
    )
  }

  function App() {
    const [form, fields] = useForm({ defaultValue: { fruit: "apple" } })
    return (
      <form id={form.id} onSubmit={form.onSubmit} noValidate>
        <Custom field={fields.fruit} />
      </form>
    )
  }

  test("the control starts at the field's initial value, in the DOM and in FormData", async () => {
    const container = await mount(<App />)
    expect(new FormData(formOf(container)).get("fruit")).toBe("apple")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("apple")
  })

  test("control.change() reaches FormData", async () => {
    const container = await mount(<App />)
    await click(container, "set")
    expect(new FormData(formOf(container)).get("fruit")).toBe("banana")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("banana")
  })

  test("a form reset snaps the control back to the default", async () => {
    // This is the half that would break first if the two halves stopped
    // meeting in the DOM: v1's reset writes the element and bumps
    // data-conform, and the future observer is watching that attribute.
    const container = await mount(<App />)
    await click(container, "set")
    const form = formOf(container)
    await act(async () => {
      form.reset()
    })
    expect(new FormData(form).get("fruit")).toBe("apple")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("apple")
  })
})

describe("getInputProps is not spreadable onto a react-aria control", () => {
  function Spread({ field }: { field: FieldMetadata<boolean> }) {
    // The shape this rule set used to recommend for "a control that renders a
    // real input". It type-checks, because JSX spread skips excess-property
    // checking, and it is wrong.
    return <Switch {...getInputProps(field, { type: "checkbox" })}>Notify me</Switch>
  }

  const withDefault = { notify: true }

  test("the spread silently loses the field's default — the switch renders off", async () => {
    function App() {
      const [form, fields] = useForm({ defaultValue: withDefault })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <Spread field={fields.notify} />
        </form>
      )
    }
    const container = await mount(<App />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.checked).toBe(false)
    // Nothing in the DOM records the loss: no `required`, no `defaultChecked`.
    expect(input.hasAttribute("required")).toBe(false)
  })

  test("ConformSwitch names the props instead, and the default survives", async () => {
    function App() {
      const [form, fields] = useForm({ defaultValue: withDefault })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformSwitch field={fields.notify} label="Notify me" />
        </form>
      )
    }
    const container = await mount(<App />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.checked).toBe(true)
    expect(new FormData(formOf(container)).get("notify")).toBe("on")
  })
})

describe("react-aria owns the ids inside its own fields", () => {
  test("react-aria follows an explicit id on a FieldError", async () => {
    // This assertion used to read the other way — that overriding the element's
    // id left aria-describedby pointing at nothing — and it was an artifact of
    // the environment, not of react-aria. This file used to call
    // GlobalRegistrator.register() in its body, which ESM hoisting runs *after*
    // its imports: react-aria was evaluated with no `document`, took its
    // server-rendering path, and there its layout effects (the ones that read
    // the rendered id back) are no-ops. Loaded into a DOM — a browser, or this
    // suite now that tests/dom.ts registers happy-dom in a preload — react-aria
    // reads the id the element actually has and points the control at it.
    //
    // So the react-aria-field variants leaving FieldError's id alone is a
    // convention, not a repair: react-aria's own id would be wired up just as
    // correctly. See the task-8 follow-up.
    const container = await mount(
      <TextField isInvalid>
        <Label>Email</Label>
        <Input />
        <FieldError id="mine">boom</FieldError>
      </TextField>,
    )
    const input = container.querySelector("input") as HTMLInputElement
    expect(container.querySelector("[slot=errorMessage]")?.id).toBe("mine")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain("mine")
    // What actually matters: the text a screen reader would read out.
    expect(input).toHaveAccessibleDescription("boom")
  })

  test("ConformField's error message is the one its input points at", async () => {
    function App() {
      const [form, fields] = useForm({
        onValidate({ formData }) {
          return parseWithValibot(formData, {
            schema: v.object({ email: v.pipe(v.string("Required"), v.nonEmpty("Required")) }),
          })
        },
      })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformField field={fields.email} label="Email" />
          <button type="submit" data-testid="submit">
            go
          </button>
        </form>
      )
    }
    const container = await mount(<App />)
    await click(container, "submit")
    const input = container.querySelector("input") as HTMLInputElement
    const message = container.querySelector("[slot=errorMessage]") as HTMLElement
    expect(message.textContent).toBe("Required")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id)
  })

  test("outside a react-aria field the variant owns the id, and it resolves", async () => {
    // The other half of the convention. A bare Switch is not a react-aria
    // field: it supplies no FieldErrorContext, so nothing generates an id for
    // the message and nothing points at it. ConformSwitch sets both ends —
    // id={field.errorId} on the message, describedBy(...) on the control — and
    // this asserts they meet, which is the failure the id-ownership rule is
    // there to prevent.
    //
    // The switch starts on and the schema rejects that, rather than the more
    // natural "you must accept": an unchecked switch submits no value at all,
    // so that shape leaves Conform with no entry to attach a field error to.
    function App() {
      const [form, fields] = useForm({
        defaultValue: { maintenance: true },
        onValidate({ formData }) {
          return parseWithValibot(formData, {
            schema: v.object({
              maintenance: v.pipe(
                v.boolean(),
                v.check((value) => !value, "Turn maintenance off before saving"),
              ),
            }),
          })
        },
      })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformSwitch field={fields.maintenance} label="Maintenance mode" />
          <button type="submit" data-testid="submit">
            go
          </button>
        </form>
      )
    }
    const container = await mount(<App />)
    await click(container, "submit")
    const input = container.querySelector("input") as HTMLInputElement
    const message = container.querySelector("[slot=errorMessage]") as HTMLElement
    expect(message.textContent).toBe("Turn maintenance off before saving")
    expect(message.id).not.toBe("")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id)
    expect(input).toHaveAccessibleDescription("Turn maintenance off before saving")
  })
})

describe("the list-backed pickers own their value", () => {
  // ConformStoragePicker and ConformColorSwatchPicker used to keep the
  // selection in a react-stately list the caller passed and mirror it into
  // `<input type="hidden" value={…} />`. That submits, and nothing else: a
  // reset writes the elements Conform has registered, and a React-controlled
  // mirror is not one of them, so the chips stayed where the user left them
  // while the rest of the form snapped back. The value now lives in a
  // registered control and the list is a projection of it — which is only
  // observable through a reset, an update, and a change made from the list.
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
          <button
            type="button"
            data-testid="drop"
            onClick={() => {
              const first = list.items[0]
              if (first) list.remove(first.id)
            }}
          >
            drop
          </button>
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
