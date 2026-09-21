/**
 * The field layout convention: one stack, one footprint, one control mark.
 *
 * Before task #186 the label → control → hint stack was written five ways with
 * four different values — `Field`'s sibling selectors, verbatim copies of them
 * in `text-field.tsx`, `number-field.tsx`, `time-field.tsx` and
 * `color-field.tsx`, and a `gap-1.5` / `gap-2` / `gap-3` / nothing flex root in
 * thirty of the thirty-three `conform-*` variants — so a `ConformField` and a `ConformCheckbox` in one
 * column had label→control gaps of 6px and 8px. Nothing failed; the fields
 * simply did not line up.
 *
 * That is what the source-level half of this file holds: the selectors live in
 * exactly one file, and no field root spaces itself with a gap of its own. A
 * copy is how the drift started, so a copy is what fails here.
 *
 * The rendered half holds the other end of the same convention. The stack, and
 * `FieldRow`'s subgrid, both place a field's control by `data-slot="control"`
 * on the element the label points at — so a variant whose control carries no
 * mark, or carries two, silently loses its spacing and its row. Both are
 * invisible in a DOM snapshot and neither is a type error.
 */
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { getFormProps, useForm } from "@conform-to/react"
import { render } from "@testing-library/react"
import { Checkbox } from "../src/components/checkbox"
import { ConformCalendar } from "../src/components/conform-calendar"
import { ConformCheckbox } from "../src/components/conform-checkbox"
import { ConformCheckboxGroup } from "../src/components/conform-checkbox-group"
import { ConformField } from "../src/components/conform-field"
import { ConformFileTrigger } from "../src/components/conform-file-trigger"
import { ConformInputOTP } from "../src/components/conform-input-otp"
import { ConformNumberField } from "../src/components/conform-number-field"
import { ConformRadioGroup } from "../src/components/conform-radio-group"
import { ConformSelect } from "../src/components/conform-select"
import { ConformSlider } from "../src/components/conform-slider"
import { ConformSwitch } from "../src/components/conform-switch"
import { ConformTagField } from "../src/components/conform-tag-field"
import { ConformTextarea } from "../src/components/conform-textarea"
import { ConformTimeField } from "../src/components/conform-time-field"
import { FieldRow } from "../src/components/field"
import { InputOTPGroup, InputOTPSlot } from "../src/components/input-otp"
import { Radio } from "../src/components/radio"
import { SelectItem } from "../src/components/select"

const COMPONENTS_DIR = join(import.meta.dir, "..", "src", "components")

const sourceOf = (file: string) => readFileSync(join(COMPONENTS_DIR, file), "utf8")
const componentFiles = readdirSync(COMPONENTS_DIR).filter((file) => file.endsWith(".tsx"))
const conformFiles = componentFiles.filter((file) => file.startsWith("conform-"))

/**
 * The opening tag of the first element a component returns — its field root.
 *
 * Read with a brace counter rather than a regex: every root here carries a
 * `className={…}` holding `>` inside an arrow function, so "up to the first
 * `>`" would cut the tag in half.
 */
function rootOpeningTag(source: string): string {
  const body = source.slice(source.indexOf("\n  return ("))
  const start = body.search(/<[A-Z]/)
  let braces = 0
  let angles = 0
  for (let i = start; i < body.length; i++) {
    const char = body[i]
    if (char === "{") braces++
    else if (char === "}") braces--
    else if (braces > 0) continue
    // A generic argument — `<Select<T> …>` — closes an angle of its own, and
    // it is not the end of the tag.
    else if (char === "<" && i > start) angles++
    else if (char === ">") {
      if (angles === 0) return body.slice(start, i + 1)
      angles--
    }
  }
  throw new Error("no opening tag found")
}

describe("the stack is defined once", () => {
  // The five selectors, as `field.tsx` writes them. A file that repeats one is
  // the drift this suite exists to stop — see `fieldStackStyles`.
  const selectors = [
    "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
    "[&>[data-slot=label]+[slot='description']]:mt-1",
    "[&>[slot=description]+[data-slot=control]]:mt-1.5",
    "[&>[data-slot=control]+[slot=description]]:mt-1.5",
    "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
  ]

  for (const selector of selectors) {
    test(`\`${selector}\` appears only in field.tsx`, () => {
      const owners = componentFiles.filter((file) => sourceOf(file).includes(selector))
      expect(owners).toEqual(["field.tsx"])
    })
  }
})

/**
 * The library components that are themselves a field root — they apply
 * `fieldStyles` in their own file, so a `conform-*` variant built on one
 * inherits the stack without naming it. `NumberField` is the example the task
 * started from: it used to carry its own copy of the five selectors.
 */
const stackOwners = new Set(
  componentFiles
    .filter((file) => !file.startsWith("conform-") && sourceOf(file).includes("fieldStyles"))
    .flatMap((file) =>
      Array.from(sourceOf(file).matchAll(/^(?:export )?(?:function|const) ([A-Z]\w*)/gm), (m) => m[1]),
    ),
)

describe("every conform-* root wears the shared stack", () => {
  // Non-zero only: `conform-slider` sets `gap-y-0` on purpose, to stand the
  // `Slider`'s own gap down in favour of the stack's margins.
  const ownGap = /\b(?:gap|space)-(?:[xy]-)?(?!0\b)[\d.]/

  for (const file of conformFiles) {
    test(file, () => {
      const tag = rootOpeningTag(sourceOf(file))
      const name = tag.slice(1).match(/^[A-Z]\w*/)?.[0] ?? ""
      const applies = tag.includes("fieldStyles") || tag.includes("fieldStackStyles")
      expect(applies || stackOwners.has(name)).toBe(true)
      expect(tag).not.toMatch(ownGap)
    })
  }
})

/**
 * One form holding one field per variant. Typed rather than parsed from a
 * valibot schema: nothing here asserts validation, only what each variant puts
 * in the DOM, and a schema would only be a second place to keep the shape.
 */
interface Shape {
  name: string
  bio: string
  plan: string
  quantity: number
  terms: boolean
  alerts: boolean
  topics: string[]
  tier: string
  tags: string
  code: string
  volume: number
  startsAt: string
  day: string
  avatar: File
}

function Form() {
  const [form, fields] = useForm<Shape>({
    id: "field-stack",
    onSubmit: (event) => event.preventDefault(),
  })

  return (
    // A raw <form> is what `getFormProps` is for — the documented exception the
    // repo's own rule set carries for fixtures, as in `conform-field.test.tsx`.
    <form {...getFormProps(form)}>
      <FieldRow data-testid="row" columns={3}>
        <ConformField field={fields.name} label="Name" description="Your full name" />
        <ConformTextarea field={fields.bio} label="Bio" />
        <ConformSelect field={fields.plan} label="Plan">
          <SelectItem id="free">Free</SelectItem>
        </ConformSelect>
        <ConformNumberField field={fields.quantity} label="Quantity" />
        <ConformCheckbox field={fields.terms} label="I accept" />
        <ConformSwitch field={fields.alerts} label="Alerts" />
        <ConformCheckboxGroup field={fields.topics} label="Topics">
          <Checkbox value="news">News</Checkbox>
          <Checkbox value="offers">Offers</Checkbox>
        </ConformCheckboxGroup>
        <ConformRadioGroup field={fields.tier} label="Tier">
          <Radio value="basic">Basic</Radio>
          <Radio value="pro">Pro</Radio>
        </ConformRadioGroup>
        <ConformTagField field={fields.tags} label="Tags" />
        <ConformInputOTP field={fields.code} label="Code" maxLength={2}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </ConformInputOTP>
        <ConformSlider field={fields.volume} label="Volume" />
        <ConformTimeField field={fields.startsAt} label="Starts at" />
        <ConformCalendar field={fields.day} label="Day" />
        <ConformFileTrigger field={fields.avatar} label="Avatar" />
      </FieldRow>
    </form>
  )
}

/** The direct children of `element` that claim to be the field's control. */
const controlsOf = (element: Element) =>
  Array.from(element.children).filter((child) => child.getAttribute("data-slot") === "control")

/**
 * Whether `element` takes a cell of the grid it sits in.
 *
 * react-aria puts plumbing beside the control it renders — a `<template>`, a
 * `hidden` mirror input, the fixed-position container holding a Select's real
 * `<select>` — and so do the variants, with their `sr-only` `BaseControl`. None
 * of it is laid out, so none of it takes a row or a column; only what is in
 * flow has to be accounted for.
 */
const isInFlow = (element: Element) => {
  if (element.tagName === "TEMPLATE") return false
  if (element.hasAttribute("hidden")) return false
  if (element.getAttribute("type") === "hidden") return false
  const style = element.getAttribute("style") ?? ""
  const className = element.getAttribute("class") ?? ""
  return !/position:\s*(?:fixed|absolute)/.test(style) && !className.split(/\s+/).includes("sr-only")
}

describe("every field hands FieldRow exactly one control", () => {
  const { getByTestId } = render(<Form />)
  const row = getByTestId("row")
  const roots = Array.from(row.children).filter(isInFlow)

  test("the row rendered every field, and nothing else takes a cell", () => {
    expect(roots).toHaveLength(14)
  })

  for (const [index, root] of roots.entries()) {
    test(`field ${index + 1} (<${root.tagName.toLowerCase()}>)`, () => {
      // Exactly one: none and the label has nothing to sit above, so the field
      // loses its spacing and its control row; two and the second is placed in
      // a grid column of its own beside the first.
      expect(controlsOf(root)).toHaveLength(1)
    })
  }

  test("nothing out of the stack sits between a label and its control", () => {
    // The `sr-only` BaseControl the hidden-input variants register goes first,
    // before the label, for exactly this reason: `label + control` is an
    // adjacent-sibling selector and it does not see past an element, laid out
    // or not.
    for (const root of roots) {
      const parts = Array.from(root.children)
      const label = parts.findIndex((child) => child.getAttribute("data-slot") === "label")
      const control = parts.findIndex((child) => child.getAttribute("data-slot") === "control")
      if (label === -1 || control === -1) continue
      const between = parts.slice(label + 1, control)
      expect(between.every((child) => child.getAttribute("slot") === "description")).toBe(true)
    }
  })

  test("a label, where the field has one, is a direct child too", () => {
    // The stack and the subgrid both place the label from the root's own
    // children — a label nested one level deeper lands on the control row.
    const labelled = roots.filter((root) =>
      Array.from(root.children).some((child) => child.getAttribute("data-slot") === "label"),
    )
    // Checkbox, Switch and TagField carry their label inside the control (a
    // checkbox's label belongs beside its box); the other eleven do not.
    expect(labelled).toHaveLength(11)
  })
})

describe("FieldRow", () => {
  test("puts the three parts on three rows, and guards the subgrid", () => {
    const { getByTestId } = render(
      <FieldRow data-testid="row">
        <div />
      </FieldRow>,
    )
    const classes = getByTestId("row").className

    // Narrow, and without subgrid support, the row stays a usable stack / grid.
    expect(classes).toContain("flex w-full flex-col gap-6")
    expect(classes).toContain("sm:grid")
    expect(classes).toContain("sm:grid-cols-2")

    // Everything the subgrid does is behind the support guard, as it is in
    // sidebar.tsx, navbar.tsx and dropdown.tsx.
    for (const utility of classes.split(/\s+/).filter((c) => c.includes("subgrid"))) {
      expect(utility).toContain("supports-[grid-template-rows:subgrid]")
    }
    expect(classes).toContain("*:row-span-3")
    expect(classes).toContain("[&>*>[data-slot=label]]:row-start-1")
    expect(classes).toContain("[&>*>[slot=errorMessage]]:row-start-3")

    // The reserved hint row — the half that stops a field going invalid from
    // pushing the page down.
    expect(classes).toContain("minmax(--spacing(4.5),auto)")
  })

  test("columns is a fixed set of classes, not an interpolation", () => {
    // Tailwind scans source text, so `sm:grid-cols-${n}` would compile to
    // nothing at all.
    const source = readFileSync(join(COMPONENTS_DIR, "field.tsx"), "utf8")
    expect(source).toContain('3: "sm:grid-cols-3"')
    expect(source).not.toMatch(/grid-cols-\$\{/)
  })
})
