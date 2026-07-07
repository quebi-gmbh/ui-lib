import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import type { AsyncSelectLoadParams } from "@/components/async-select"
import { Button } from "@/components/button"
import { ConformAsyncSelect } from "@/components/conform-async-select"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A single-value select submits one entry (empty when nothing is chosen).
  assignee: v.pipe(v.string("Please choose an assignee"), v.minLength(1, "Please choose an assignee")),
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

async function loadPeople({ search, cursor, signal }: AsyncSelectLoadParams) {
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

const AssigneeForm = () => {
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
      <ConformAsyncSelect<Person>
        field={fields.assignee}
        label="Assignee"
        aria-label="Assignee"
        placeholder="Select an assignee"
        load={loadPeople}
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformAsyncSelectExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "Submit without choosing anyone to see the validation error wired from field metadata. Options load from the source as you search.",
    render: () => <AssigneeForm />,
  },
]
