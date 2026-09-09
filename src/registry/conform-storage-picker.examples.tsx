import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { useListData } from "react-stately"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformStoragePicker } from "@/components/conform-storage-picker"
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
  const list = useListData<{ id: number; name: string }>({
    initialItems: [{ id: 1, name: "128GB" }],
  })

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
      <ConformStoragePicker
        field={fields.storage}
        label="Storage configurations"
        description="Select every storage size this device ships in."
        list={list}
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const EmptyStorageForm = () => {
  const list = useListData<{ id: number; name: string }>({
    initialItems: [],
  })

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
      <ConformStoragePicker field={fields.storage} label="Storage configurations" list={list} />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformStoragePickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "Pre-seeded with 128GB. Toggle chips to add or remove sizes; selected chips use the quebi brand accent.",
    render: () => <StorageForm />,
  },
  {
    title: "Required validation",
    description: "Starts empty — submit without picking a size to see the field-derived error.",
    render: () => <EmptyStorageForm />,
  },
]
