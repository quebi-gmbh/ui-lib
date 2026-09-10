import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { useListData } from "react-stately"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformStoragePicker } from "@/components/conform-storage-picker"
import { Tag, TagGroup, TagList } from "@/components/tag-group"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The picker submits a comma-joined string of storage labels (e.g.
  // "128GB,1TB"). Require at least one selection.
  storage: v.pipe(
    v.string("Pick at least one storage size"),
    v.minLength(1, "Pick at least one storage size"),
  ),
})

const StorageForm = () => {
  const [form, fields] = useForm({
    // The selected sizes are the form's value, so the default is declared here
    // — this is what repopulates after a failed submit and what Reset goes
    // back to.
    defaultValue: { storage: "128GB" },
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
      <ConformStoragePicker
        field={fields.storage}
        label="Storage configurations"
        description="Select every storage size this device ships in."
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

const EmptyStorageForm = () => {
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
      <ConformStoragePicker field={fields.storage} label="Storage configurations" />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const MirroredStorageForm = () => {
  // Optional: a list that mirrors the selection, so the same sizes can be shown
  // and removed somewhere else. The picker still owns the value — removing a
  // tag here writes the field, and Reset re-seeds both.
  const list = useListData<{ id: number; name: string }>({ initialItems: [] })

  const [form, fields] = useForm({
    defaultValue: { storage: "256GB,1TB" },
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
      <ConformStoragePicker
        field={fields.storage}
        label="Storage configurations"
        description="Select every storage size this device ships in."
        list={list}
      />
      <TagGroup aria-label="Selected sizes" onRemove={(keys) => list.remove(...keys)}>
        <TagList items={list.items}>{(item) => <Tag id={item.id}>{item.name}</Tag>}</TagList>
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

export const conformStoragePickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "The form declares 128GB as the default. Toggle chips to add or remove sizes; Reset snaps the selection back, because the value lives in the field rather than beside it.",
    render: () => <StorageForm />,
  },
  {
    title: "Required validation",
    description: "Starts empty — submit without picking a size to see the field-derived error.",
    render: () => <EmptyStorageForm />,
  },
  {
    title: "Mirrored into a tag list",
    description:
      "Pass an optional react-stately list to surface the selection elsewhere. Removing a tag writes the field; Reset re-seeds the list from the form's default.",
    render: () => <MirroredStorageForm />,
  },
]
