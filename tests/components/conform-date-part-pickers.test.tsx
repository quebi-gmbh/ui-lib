/**
 * ConformYearPicker, ConformMonthPicker and ConformWeekPicker — the wire
 * values, and the id wiring nothing upstream does for them.
 *
 * All three wrap a react-stately ListBox: no `name`, no native form control, so
 * the form value is a registered control from `@conform-to/react/future` and
 * everything about it is invisible until someone submits. What that control
 * carries is the decision each of these components makes, so it is asserted
 * rather than described:
 *
 * - a year is January 1 of it, and a month the first of it — a full ISO
 *   `YYYY-MM-DD` either way, the same wire format as every other Date & time
 *   variant, rather than `2026` or `2026-09`;
 * - a week is two ISO dates in a hidden `<fieldset>` (`<name>.start` /
 *   `<name>.end`), never a `YYYY-Www` token, which is ambiguous about the year
 *   it belongs to and would put that ambiguity on the wire.
 *
 * The shape of the registered control is pinned too — hidden by CSS, never by
 * the attribute, never `type="hidden"` — for the reasons spelled out in
 * `src/components/conform-time-field.tsx`. `tests/conform-binding.test.tsx`
 * makes the same three checks for the variants that came before these.
 *
 * The locale is pinned for every render: `useLocale()` otherwise answers with
 * the runtime default, and a Sunday-first machine would put a different seven
 * days in the row the week test clicks.
 *
 * The DOM comes from `tests/dom.ts`, preloaded for every test file.
 */
import { describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nProvider } from "react-aria-components"
import * as v from "valibot"
import { Button } from "../../src/components/button"
import { ConformMonthPicker } from "../../src/components/conform-month-picker"
import { ConformWeekPicker } from "../../src/components/conform-week-picker"
import { ConformYearPicker } from "../../src/components/conform-year-picker"

const yearSchema = v.object({
  foundedIn: v.pipe(v.string("Pick a year"), v.nonEmpty("Pick a year")),
})
const monthSchema = v.object({
  reportOn: v.pipe(
    v.string("Pick a month"),
    v.check((iso) => !iso.endsWith("-12-01"), "December closes for reporting"),
  ),
})
const weekSchema = v.object({
  deliveryWeek: v.pipe(
    v.object({ start: v.string("Pick a week"), end: v.string("Pick a week") }),
    v.check(
      ({ start, end }) => start.slice(0, 7) === end.slice(0, 7),
      "A delivery week has to sit inside one month",
    ),
  ),
})

// A raw <form> is what a Conform form binds to; the library's own rule points
// callers at react-router's <Form>, which would need a router around every test
// here to prove nothing about the binding. That is the rule's own published
// exception, and in this repo it is a `localScopes` entry naming <form> alone —
// so every other element on the tier-1 list is still checked in this file.
function YearForm({ foundedIn }: { foundedIn?: string }) {
  const [form, fields] = useForm({
    id: "year-form",
    defaultValue: foundedIn ? { foundedIn } : undefined,
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: yearSchema }),
    onSubmit: (event) => event.preventDefault(),
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformYearPicker
        field={fields.foundedIn}
        label="Founded in"
        description="January 1 of the year."
      />
      <Button type="submit">Save</Button>
    </form>
  )
}

function MonthForm({ reportOn }: { reportOn?: string }) {
  const [form, fields] = useForm({
    id: "month-form",
    defaultValue: reportOn ? { reportOn } : undefined,
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: monthSchema }),
    onSubmit: (event) => event.preventDefault(),
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformMonthPicker field={fields.reportOn} label="Reporting month" />
      <Button type="submit">Save</Button>
    </form>
  )
}

function WeekForm({ deliveryWeek }: { deliveryWeek?: { start: string; end: string } }) {
  const [form, fields] = useForm({
    id: "week-form",
    defaultValue: deliveryWeek ? { deliveryWeek } : undefined,
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: weekSchema }),
    onSubmit: (event) => event.preventDefault(),
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformWeekPicker field={fields.deliveryWeek} label="Delivery week" />
      <Button type="submit">Save</Button>
    </form>
  )
}

/**
 * Render a fixture in a pinned locale and hand back queries scoped to *its*
 * container — not `screen` or `document.querySelector`, because other files in
 * this suite mount by hand and leave their containers in `document.body`, where
 * a global query would find the wrong form.
 */
function renderForm(element: React.ReactElement) {
  const { container } = render(<I18nProvider locale="en-GB">{element}</I18nProvider>)
  const scope = within(container)
  const form = container.querySelector("form") as HTMLFormElement
  return {
    form,
    scope,
    /** What the form would post under `name`. */
    submitted: (name: string) => new FormData(form).get(name),
    /** The control Conform registered for `name` — the whole form value. */
    registered: (name: string) => form.querySelector(`[name="${name}"]`) as HTMLElement,
    option: (name: string | RegExp) => scope.getByRole("option", { name }),
    grid: (name: string) => scope.getByRole("listbox", { name }),
    message: () => container.querySelector("[slot=errorMessage]") as HTMLElement,
    save: () => scope.getByRole("button", { name: "Save" }),
  }
}

describe("ConformYearPicker", () => {
  test("starts at the field's initial value, in the grid and in FormData", () => {
    const { submitted, option } = renderForm(<YearForm foundedIn="2019-01-01" />)

    expect(submitted("foundedIn")).toBe("2019-01-01")
    expect(option("2019")).toHaveAttribute("aria-selected", "true")
  })

  test("submits January 1 of the year that was clicked", async () => {
    const user = userEvent.setup()
    const { submitted, option } = renderForm(<YearForm foundedIn="2019-01-01" />)

    // On the page the initial value opens — the decade 2010–2019, plus the year
    // either side of it.
    await user.click(option("2015"))

    expect(submitted("foundedIn")).toBe("2015-01-01")
  })

  test("an empty submit shows the schema's message, and the grid points at it", async () => {
    // Nothing generates these ids: the message is a sibling of the grid, not a
    // child of a react-aria field, so the variant sets both ends itself.
    const user = userEvent.setup()
    const { save, message, grid } = renderForm(<YearForm />)

    await user.click(save())

    expect(message().textContent).toBe("Pick a year")
    expect(message().id).not.toBe("")
    expect(grid("Founded in").getAttribute("aria-describedby")?.split(" ")).toContain(message().id)
  })

  test("the description is announced with the grid", () => {
    const { grid } = renderForm(<YearForm foundedIn="2019-01-01" />)

    expect(grid("Founded in")).toHaveAccessibleDescription("January 1 of the year.")
  })
})

describe("ConformMonthPicker", () => {
  test("starts at the field's initial value, in the grid and in FormData", () => {
    const { submitted, option } = renderForm(<MonthForm reportOn="2026-03-01" />)

    expect(submitted("reportOn")).toBe("2026-03-01")
    expect(option("March 2026")).toHaveAttribute("aria-selected", "true")
  })

  test("submits the first of the month that was clicked", async () => {
    const user = userEvent.setup()
    const { submitted, option } = renderForm(<MonthForm reportOn="2026-03-01" />)

    await user.click(option("December 2026"))

    // A full ISO date, not the `2026-12` a month input would post: one wire
    // format for the whole category, and `slice(0, 7)` where a server wants it.
    expect(submitted("reportOn")).toBe("2026-12-01")
  })

  test("a rejected month reports the schema's message", async () => {
    const user = userEvent.setup()
    const { save, message, option } = renderForm(<MonthForm reportOn="2026-03-01" />)

    await user.click(option("December 2026"))
    await user.click(save())

    expect(message().textContent).toBe("December closes for reporting")
  })
})

describe("ConformWeekPicker", () => {
  const MARCH_WEEK = { start: "2026-03-02", end: "2026-03-08" }

  test("submits the whole week as two ISO dates, not a week token", () => {
    const { form, submitted, registered } = renderForm(<WeekForm deliveryWeek={MARCH_WEEK} />)

    expect(submitted("deliveryWeek.start")).toBe("2026-03-02")
    expect(submitted("deliveryWeek.end")).toBe("2026-03-08")
    // The parts live inside the one registered fieldset, and nothing posts a
    // `deliveryWeek` of its own.
    expect(registered("deliveryWeek").tagName).toBe("FIELDSET")
    expect(form.querySelectorAll('[name="deliveryWeek.start"]')).toHaveLength(1)
  })

  test("clicking a row submits that whole week", async () => {
    const user = userEvent.setup()
    const { submitted, option } = renderForm(<WeekForm deliveryWeek={MARCH_WEEK} />)

    // Monday 9 March 2026 through Sunday 15 March — ISO week 11, and the row is
    // labelled by that number, which is what a user reads it by.
    await user.click(option(/^Week 11,/))

    expect(submitted("deliveryWeek.start")).toBe("2026-03-09")
    expect(submitted("deliveryWeek.end")).toBe("2026-03-15")
  })

  test("a week straddling two months reports the schema's message on the field", async () => {
    const user = userEvent.setup()
    const { save, message, option, grid } = renderForm(<WeekForm deliveryWeek={MARCH_WEEK} />)

    // Monday 23 February through Sunday 1 March: a whole week, two months.
    await user.click(option(/^Week 9,/))
    await user.click(save())

    expect(message().textContent).toBe("A delivery week has to sit inside one month")
    expect(grid("Delivery week").getAttribute("aria-describedby")?.split(" ")).toContain(
      message().id,
    )
  })
})

describe("the registered control stays focusable for Conform's focus-on-error", () => {
  // A real browser no-ops `.focus()` on an element carrying the `hidden`
  // attribute, so Conform's focus-on-error would land nowhere and the forward
  // to the visible grid would never run. Neither jsdom nor happy-dom models
  // that, so what is pinned is the shape the browser needs — see
  // `src/components/conform-time-field.tsx` and task #11.
  const variants: Array<[string, string, React.ReactElement]> = [
    ["conform-year-picker", "foundedIn", <YearForm key="year" />],
    ["conform-month-picker", "reportOn", <MonthForm key="month" />],
    ["conform-week-picker", "deliveryWeek", <WeekForm key="week" />],
  ]

  for (const [slug, name, element] of variants) {
    test(`${slug} hides its registered control with CSS, not with the attribute`, () => {
      const { registered } = renderForm(element)
      const control = registered(name)

      expect(control).not.toBeNull()
      expect(control.hasAttribute("hidden")).toBe(false)
      expect(control.getAttribute("tabindex")).toBe("-1")
      expect(control.className).toContain("sr-only")
      // And the one that keeps it a working form value.
      expect(control.getAttribute("type")).not.toBe("hidden")
    })
  }
})
