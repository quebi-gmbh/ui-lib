import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { useListData } from "react-stately"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformStoragePicker } from "@/components/conform-storage-picker"
import type { ComponentExample } from "./types"

const schema = z.object({
  // The picker submits a comma-joined string of storage labels (e.g.
  // "128GB,1TB"). Require at least one selection.
  storage: z
    .string({ message: "Pick at least one storage size" })
    .min(1, "Pick at least one storage size"),
})

const StorageForm = () => {
  const list = useListData<{ id: number; name: string }>({
    initialItems: [{ id: 1, name: "128GB" }],
  })

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
  })

  return (
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
      return parseWithZod(formData, { schema })
    },
  })

  return (
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
