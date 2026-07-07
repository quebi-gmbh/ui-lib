import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import type { AsyncMultipleSelectLoadParams } from "@/components/async-multiple-select"
import { Button } from "@/components/button"
import { ConformAsyncMultipleSelect } from "@/components/conform-async-multiple-select"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A multi-value select submits one entry per selection under the same name;
  // Conform surfaces that as a string array.
  reviewers: v.pipe(v.array(v.string()), v.minLength(1, "Pick at least one reviewer")),
})

interface Person {
  id: string
  name: string
}

const PEOPLE: Person[] = Array.from({ length: 60 }, (_, i) => ({
  id: `p-${i + 1}`,
  name: `${["Ada", "Alan", "Grace", "Linus", "Margaret", "Dennis"][i % 6]} #${i + 1}`,
}))

const PAGE_SIZE = 20

async function loadPeople({ search, cursor, signal }: AsyncMultipleSelectLoadParams) {
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 350)
    signal.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

  const q = search.trim().toLowerCase()
  const matches = q ? PEOPLE.filter((p) => p.name.toLowerCase().includes(q)) : PEOPLE
  const start = cursor ? Number(cursor) : 0
  const page = matches.slice(start, start + PAGE_SIZE)
  const nextStart = start + PAGE_SIZE

  return { items: page, cursor: nextStart < matches.length ? String(nextStart) : undefined }
}

const ReviewersForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformAsyncMultipleSelect<Person>
        field={fields.reviewers}
        label="Reviewers"
        aria-label="Reviewers"
        placeholder="Select reviewers"
        load={loadPeople}
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformAsyncMultipleSelectExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "Submit without selecting anyone to see the validation error wired from field metadata. Options load from the source as you search.",
    render: () => <ReviewersForm />,
  },
]
