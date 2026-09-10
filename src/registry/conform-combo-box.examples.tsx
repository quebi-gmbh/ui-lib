import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ComboBoxContent, ComboBoxItem } from "@/components/combo-box"
import { ConformComboBox } from "@/components/conform-combo-box"
import type { ComponentExample } from "./types"

const COUNTRIES = [
  { id: "de", name: "Germany" },
  { id: "fr", name: "France" },
  { id: "es", name: "Spain" },
  { id: "it", name: "Italy" },
  { id: "pt", name: "Portugal" },
]

const schema = v.object({
  country: v.pipe(v.string("Pick a country"), v.nonEmpty("Pick a country")),
})

const CountryForm = () => {
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
      <ConformComboBox
        field={fields.country}
        label="Country"
        placeholder="Start typing…"
        description="The selected option's key is what submits."
      >
        <ComboBoxContent items={COUNTRIES}>
          {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ConformComboBox>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformComboBoxExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit without choosing to see the validation error wired from field metadata.",
    render: () => <CountryForm />,
  },
]
