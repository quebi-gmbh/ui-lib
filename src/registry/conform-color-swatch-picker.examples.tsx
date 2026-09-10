import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { useListData } from "react-stately"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformColorSwatchPicker } from "@/components/conform-color-swatch-picker"
import { Tag, TagGroup, TagList } from "@/components/tag-group"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The picker submits a comma-joined string of color keys. Split it back into
  // an array, then require at least one selection.
  colors: v.pipe(
    v.unknown(),
    v.transform((value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),
    v.minLength(1, "Pick at least one color"),
  ),
})

const ColorsForm = () => {
  const [form, fields] = useForm({
    // The selection is the form's value, so the default is declared here — this
    // is what repopulates after a failed submit and what Reset goes back to.
    defaultValue: { colors: ["teal"] },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformColorSwatchPicker
        field={fields.colors}
        label="Device colors"
        description="Select one or more colors. The selection is submitted as a list of keys."
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Submit
        </Button>
        <Button type="reset" intent="outline" size="sm">
          Reset
        </Button>
      </div>
    </form>
  )
}

const EmptyForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformColorSwatchPicker field={fields.colors} label="Device colors" />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const MirroredColorsForm = () => {
  // Optional: a list that mirrors the selection, so the same colors can be
  // shown and removed somewhere else. The picker still owns the value —
  // removing a tag here writes the field, and Reset re-seeds both.
  const colorList = useListData<{ id: number; name: string }>({ initialItems: [] })

  const [form, fields] = useForm({
    defaultValue: { colors: ["teal", "orange"] },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformColorSwatchPicker field={fields.colors} list={colorList} label="Device colors" />
      <TagGroup aria-label="Selected colors" onRemove={(keys) => colorList.remove(...keys)}>
        <TagList items={colorList.items}>{(item) => <Tag id={item.id}>{item.name}</Tag>}</TagList>
      </TagGroup>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Submit
        </Button>
        <Button type="reset" intent="outline" size="sm">
          Reset
        </Button>
      </div>
    </form>
  )
}

export const conformColorSwatchPickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "The form declares teal as the default. Toggle swatches to build the selection; Reset snaps it back, because the value lives in the field rather than beside it.",
    render: () => <ColorsForm />,
  },
  {
    title: "Validation",
    description: "Submit with nothing selected to see the error wired from field metadata.",
    render: () => <EmptyForm />,
  },
  {
    title: "Mirrored into a tag list",
    description:
      "Pass an optional react-stately list to surface the selection elsewhere. Removing a tag writes the field; Reset re-seeds the list from the form's default.",
    render: () => <MirroredColorsForm />,
  },
]
