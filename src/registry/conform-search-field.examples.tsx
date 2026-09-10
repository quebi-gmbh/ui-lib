import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformSearchField } from "@/components/conform-search-field"
import type { ComponentExample } from "./types"

const schema = v.object({
  query: v.pipe(v.string(), v.minLength(3, "Search for at least 3 characters")),
})

const SearchForm = () => {
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
      <ConformSearchField
        field={fields.query}
        label="Search"
        placeholder="Search the archive"
        description="Part of a submitted form — a filter box would be component state instead."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformSearchFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit a one-letter query to see the validation error wired from field metadata.",
    render: () => <SearchForm />,
  },
]
