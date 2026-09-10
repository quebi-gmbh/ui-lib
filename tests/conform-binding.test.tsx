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
 * no longer registers its own. It mounts by hand (`tests/mount.ts`) rather than
 * through React Testing Library because what it asserts is the hand-off between
 * Conform and react-aria, which is easier to read as explicit mount / act steps.
 *
 * What the two list-backed pickers do on top of all this — projecting a
 * react-stately list off the registered value — lives in
 * `conform-list-pickers.test.tsx`, which shares the same mount helper.
 */
import { afterEach, describe, expect, test } from "bun:test"
import { type FieldMetadata, getInputProps, useForm } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { parseWithValibot } from "@conform-to/valibot"
import { act } from "react"
// The third block below asserts what react-aria itself does with an id inside
// its own field, and that is the fact every conform-* variant's id handling is
// built on. Going through ui-lib's TextField would move the assertion onto the
// wrapper: whether the wrapper forwards, not whether react-aria follows. The
// rule stands everywhere else in tests/ — a fixture reaching for react-aria's
// Button instead of ours is the ordinary defect the rule describes, which is
// why this is one line's exemption rather than a localScopes entry.
// biome-ignore lint/style/noRestrictedImports: this file pins react-aria's own id ownership, so the primitives are the subject of the assertion rather than a shortcut around ui-lib's wrappers.
import { FieldError, Input, Label, TextField } from "react-aria-components"
import * as v from "valibot"
import { Button } from "../src/components/button"
import { ChoiceBoxItem, ChoiceBoxLabel } from "../src/components/choice-box"
import { ConformCalendar } from "../src/components/conform-calendar"
import { ConformChoiceBox } from "../src/components/conform-choice-box"
import { ConformColorPicker } from "../src/components/conform-color-picker"
import { ConformColorSwatchPicker } from "../src/components/conform-color-swatch-picker"
import {
  type ConformDateRange,
  ConformDateRangePicker,
} from "../src/components/conform-date-range-picker"
import { ConformDaySchedule } from "../src/components/conform-day-schedule"
import { ConformField } from "../src/components/conform-field"
import { ConformFileTrigger } from "../src/components/conform-file-trigger"
import {
  type ConformCalendarRange,
  ConformRangeCalendar,
} from "../src/components/conform-range-calendar"
import { ConformStoragePicker } from "../src/components/conform-storage-picker"
import { ConformSwitch } from "../src/components/conform-switch"
import { ConformTimeField } from "../src/components/conform-time-field"
import type { DaySpan } from "../src/components/day-schedule"
import { Switch } from "../src/components/switch"
import { click, formOf, mount, unmountAll } from "./mount"

// Mounting by hand means unmounting by hand — see tests/mount.ts for why the
// cleanup is registered per file rather than by the helper module.
afterEach(unmountAll)

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
        <Button type="button" data-testid="set" onPress={() => control.change("banana")}>
          set
        </Button>
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
    // The rule set bans this shape (seed-toggles-with-default-selected), and it
    // is rendered here on purpose: the two tests below measure what it costs.
    // Biome cannot suppress a GritQL plugin diagnostic in place, so the argument
    // is a `localScopes` entry naming this file and that one rule — see
    // scripts/generate-lint-config.ts.
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
          <Button type="submit" data-testid="submit">
            go
          </Button>
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
          <Button type="submit" data-testid="submit">
            go
          </Button>
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

describe("the registered control stays focusable for Conform's focus-on-error", () => {
  // After a failed submit, Conform v1 focuses the first errored field with a
  // bare `element.focus()`. For a control with no native form value that field
  // is the registered `BaseControl`, and a real browser no-ops `.focus()` on an
  // element carrying the `hidden` attribute: the focus lands nowhere, no
  // `focusin` fires, and `useControl`'s `onFocus` never gets to forward it to
  // the control the user can see. Checked in Chrome — task #11.
  //
  // Neither jsdom nor happy-dom models that. Both focus hidden elements and
  // fire `focusin`, so an end-to-end assertion here would pass either way and
  // prove nothing. What is pinned instead is the shape the browser needs:
  // hidden by CSS, `tabIndex={-1}`, and no `hidden` attribute — which is
  // exactly what was wrong.
  /** One form, one field named `value`, whatever type the variant binds. */
  function bound<Value>(render: (field: FieldMetadata<Value>) => React.ReactNode) {
    return function App() {
      const [form, fields] = useForm<{ value: Value }>({})
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          {render(fields.value)}
        </form>
      )
    }
  }

  const variants: Array<[string, () => React.ReactElement]> = [
    ["conform-time-field", bound<string>((f) => <ConformTimeField field={f} label="Opens at" />)],
    [
      "conform-calendar",
      bound<Date | string>((f) => <ConformCalendar field={f} label="Visit on" />),
    ],
    ["conform-color-picker", bound<string>((f) => <ConformColorPicker field={f} label="Brand" />)],
    [
      "conform-day-schedule",
      bound<string | DaySpan[]>((f) => <ConformDaySchedule field={f} label="Agenda" />),
    ],
    [
      "conform-choice-box",
      bound<string | string[]>((f) => (
        <ConformChoiceBox field={f} label="Plan" items={[{ id: "a", name: "A" }]}>
          {(item: { id: string; name: string }) => (
            <ChoiceBoxItem id={item.id} textValue={item.name}>
              <ChoiceBoxLabel>{item.name}</ChoiceBoxLabel>
            </ChoiceBoxItem>
          )}
        </ConformChoiceBox>
      )),
    ],
    ["conform-file-trigger", bound<File>((f) => <ConformFileTrigger field={f} label="Avatar" />)],
    [
      "conform-date-range-picker",
      bound<ConformDateRange>((f) => <ConformDateRangePicker field={f} label="Stay" />),
    ],
    [
      "conform-range-calendar",
      bound<ConformCalendarRange>((f) => <ConformRangeCalendar field={f} label="Trip" />),
    ],
    // The two list-backed pickers reach `useControl` through
    // `useConformListControl`, so they need the same shape and the same forward.
    [
      "conform-storage-picker",
      bound<string | string[]>((f) => <ConformStoragePicker field={f} label="Storage" />),
    ],
    [
      "conform-color-swatch-picker",
      bound<string | string[]>((f) => <ConformColorSwatchPicker field={f} label="Colors" />),
    ],
  ]

  for (const [slug, App] of variants) {
    test(`${slug} hides its registered control with CSS, not with the attribute`, async () => {
      const container = await mount(<App />)
      const registered = container.querySelector('[name="value"]') as HTMLElement
      expect(registered).not.toBeNull()
      // The three things a real browser reads before it agrees to focus it.
      expect(registered.hasAttribute("hidden")).toBe(false)
      expect(registered.getAttribute("tabindex")).toBe("-1")
      expect(registered.className).toContain("sr-only")
      // And the one that keeps it a working form value — see conform-time-field.
      expect(registered.getAttribute("type")).not.toBe("hidden")
    })
  }

  test("the forward lands on the visible control, not back on the registered one", async () => {
    const App = bound<File>((f) => <ConformFileTrigger field={f} label="Avatar" />)
    const container = await mount(<App />)
    const registered = container.querySelector('[name="value"]') as HTMLElement
    // Exactly what @conform-to/dom v1 does to the first errored field.
    await act(async () => {
      registered.focus()
    })
    const active = document.activeElement as HTMLElement
    expect(active).not.toBe(registered)
    expect(active?.tagName).toBe("BUTTON")
    expect(active?.textContent).toContain("Browse")
  })

  test("the swatch grid's forward lands on a swatch option", async () => {
    // Task #11 verified this forward in Chrome against a ColorSwatchPicker; the
    // grid is a multi-select ListBox now (task #15), so the element the forward
    // lands on is a different one. `focusFirstControl` walks `[tabindex]` and
    // skips anything negative, which is what makes the listbox's own roving
    // tabindex — -1 on the container, 0 on the current option — resolve to the
    // option rather than to the wrapper.
    const App = bound<string | string[]>((f) => (
      <ConformColorSwatchPicker field={f} label="Colors" />
    ))
    const container = await mount(<App />)
    const registered = container.querySelector('[name="value"]') as HTMLElement
    await act(async () => {
      registered.focus()
    })
    const active = document.activeElement as HTMLElement
    expect(active).not.toBe(registered)
    expect(active?.getAttribute("role")).toBe("option")
    expect(active?.getAttribute("aria-label")).toBe("black")
  })
})
